"""Agent Chat 서비스 -- SSE 스트리밍 + Function Calling 기반 대화"""

import json
import uuid
from collections.abc import AsyncGenerator

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import async_session
from src.models.glossary import GlossaryItem
from src.models.knowledge import KnowledgeChunk, KnowledgeDocument
from src.models.project import Project
from src.models.requirement import Requirement
from src.models.session import Session
from src.prompts.agent.chat import build_agent_chat_prompt
from src.services import embedding_svc, session_svc
from src.services.llm_svc import get_client, _get_default_model
from src.services.rag_svc import search_similar_chunks

# Function Calling 도구 정의
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "extract_records",
            "description": (
                "지식 문서에서 섹션별 요구사항 레코드를 추출하여 후보 목록을 생성합니다. "
                "사용자가 '레코드 추출해줘', '요구사항을 뽑아줘', '레코드 생성' 등 "
                "레코드 추출을 **명시적으로** 요청할 때만 호출합니다. "
                "단순 문서 질의(내용 요약, 검색, 설명 요청)에는 호출하지 않습니다."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "section_id": {
                        "type": "string",
                        "description": "특정 섹션만 추출할 경우 섹션 ID. 전체 추출 시 생략.",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_srs",
            "description": "승인된 레코드를 기반으로 SRS 문서를 생성합니다. 사용자가 SRS 생성, 문서 작성 등을 요청할 때 호출합니다.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
]


async def stream_chat(
    session_id: uuid.UUID,
    message: str,
) -> AsyncGenerator[str, None]:
    """Agent Chat SSE 스트리밍 응답 생성 (Function Calling 지원)

    자체 DB 세션을 생성하여 StreamingResponse 수명 동안 유지.
    (FastAPI Depends의 DB 세션은 라우터 함수 반환 시 닫히므로 사용 불가)

    Yields SSE events:
    - data: {"type": "token", "content": "..."} -- 텍스트 토큰
    - data: {"type": "tool_call", "name": "...", "arguments": {...}} -- 도구 호출
    - data: {"type": "done"} -- 스트리밍 완료
    - data: {"type": "error", "content": "..."} -- 에러
    """
    async with async_session() as db:
        try:
            # 1. 세션 조회
            session = await db.get(Session, session_id)
            if not session:
                yield _sse_event({"type": "error", "content": "세션을 찾을 수 없습니다."})
                return

            project_id = session.project_id

            # 2. user 메시지 저장
            await session_svc.add_message(db, session_id, "user", message)
            await session_svc.update_session_title_if_first(db, session_id, message)
            await db.commit()

            # 3. DB에서 history 로드
            history = await session_svc.get_history(db, session_id, limit=50)

            # 4. 프로젝트 조회
            result = await db.execute(select(Project).where(Project.id == project_id))
            project = result.scalar_one_or_none()
            if not project:
                yield _sse_event({"type": "error", "content": "프로젝트를 찾을 수 없습니다."})
                return

            # 5. Knowledge 검색 (RAG)
            knowledge_chunks = await _fetch_knowledge_chunks(project_id, message, db)

            # 6. Glossary 조회
            glossary = await _fetch_glossary(project_id, db)

            # 7. 기존 요구사항 조회
            requirements = await _fetch_requirements(project_id, db)

            # 8. 시스템 프롬프트 빌드
            system_prompt = build_agent_chat_prompt(
                project_name=project.name,
                project_description=project.description,
                project_domain=project.domain,
                knowledge_context=knowledge_chunks,
                glossary=glossary,
                requirements=requirements,
            )

            # 9. 메시지 구성 (DB에서 로드한 history 사용 — 마지막 user 메시지 포함)
            messages = [{"role": "system", "content": system_prompt}]
            for h in history:
                messages.append({"role": h["role"], "content": h["content"]})

            logger.info(
                f"Agent Chat 스트리밍 시작: session_id={session_id}, project_id={project_id}, "
                f"messages={len(messages)}개, knowledge={len(knowledge_chunks)}개"
            )

            # 10. LLM 스트리밍 호출 (Function Calling 포함)
            client = get_client()
            stream = await client.chat.completions.create(
                model=_get_default_model(),
                messages=messages,
                tools=TOOLS,
                temperature=0.3,
                max_completion_tokens=4096,
                stream=True,
            )

            # 스트리밍 청크 처리 — tool_call과 텍스트를 분리
            tool_call_chunks: dict[int, dict] = {}  # index → {name, arguments}
            full_content = ""

            async for chunk in stream:
                if not chunk.choices:
                    continue

                delta = chunk.choices[0].delta

                # 텍스트 토큰
                if delta.content:
                    full_content += delta.content
                    yield _sse_event({"type": "token", "content": delta.content})

                # Tool call 청크 누적
                if delta.tool_calls:
                    for tc in delta.tool_calls:
                        idx = tc.index
                        if idx not in tool_call_chunks:
                            tool_call_chunks[idx] = {"name": "", "arguments": ""}
                        if tc.function and tc.function.name:
                            tool_call_chunks[idx]["name"] = tc.function.name
                        if tc.function and tc.function.arguments:
                            tool_call_chunks[idx]["arguments"] += tc.function.arguments

            # 스트리밍 완료 후 tool_call 이벤트 전송
            tool_calls_data = []
            for idx in sorted(tool_call_chunks.keys()):
                tc = tool_call_chunks[idx]
                try:
                    args = json.loads(tc["arguments"]) if tc["arguments"] else {}
                except json.JSONDecodeError:
                    args = {}

                logger.info(f"Tool call 감지: name={tc['name']}, args={args}")
                tool_calls_data.append({"name": tc["name"], "arguments": args})
                yield _sse_event({
                    "type": "tool_call",
                    "name": tc["name"],
                    "arguments": args,
                })

            # 11. assistant 메시지 저장
            await session_svc.add_message(
                db, session_id, "assistant", full_content,
                tool_calls=tool_calls_data if tool_calls_data else None,
            )
            await db.commit()

            yield _sse_event({"type": "done"})
            logger.info(f"Agent Chat 스트리밍 완료: session_id={session_id}")

        except Exception as e:
            logger.error(f"Agent Chat 스트리밍 실패: {e}")
            yield _sse_event({"type": "error", "content": f"AI 응답 생성에 실패했습니다: {str(e)}"})


async def _fetch_knowledge_chunks(
    project_id: uuid.UUID,
    message: str,
    db: AsyncSession,
) -> list[dict]:
    try:
        chunks_with_scores = await search_similar_chunks(project_id, message, 5, db)
        doc_ids = {c.document_id for c, _ in chunks_with_scores}
        doc_name_map: dict[uuid.UUID, str] = {}
        if doc_ids:
            doc_result = await db.execute(
                select(KnowledgeDocument.id, KnowledgeDocument.name)
                .where(KnowledgeDocument.id.in_(doc_ids))
            )
            for did, dname in doc_result.all():
                doc_name_map[did] = dname

        return [
            {
                "document_name": doc_name_map.get(chunk.document_id, "Unknown"),
                "chunk_index": chunk.chunk_index,
                "content": chunk.content,
            }
            for chunk, score in chunks_with_scores
        ]
    except Exception as e:
        logger.warning(f"Knowledge 검색 실패 (계속 진행): {e}")
        return []


async def _fetch_glossary(project_id: uuid.UUID, db: AsyncSession) -> list[dict]:
    try:
        g_result = await db.execute(
            select(GlossaryItem)
            .where(GlossaryItem.project_id == project_id)
            .order_by(GlossaryItem.term)
        )
        return [{"term": g.term, "definition": g.definition} for g in g_result.scalars().all()]
    except Exception as e:
        logger.warning(f"Glossary 조회 실패 (계속 진행): {e}")
        return []


async def _fetch_requirements(project_id: uuid.UUID, db: AsyncSession) -> list[dict]:
    try:
        r_result = await db.execute(
            select(Requirement)
            .where(Requirement.project_id == project_id, Requirement.is_selected == True)  # noqa: E712
            .order_by(Requirement.order_index)
        )
        return [
            {
                "display_id": r.display_id,
                "type": r.type,
                "original_text": r.original_text,
                "refined_text": r.refined_text,
            }
            for r in r_result.scalars().all()
        ]
    except Exception as e:
        logger.warning(f"요구사항 조회 실패 (계속 진행): {e}")
        return []


def _sse_event(data: dict) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
