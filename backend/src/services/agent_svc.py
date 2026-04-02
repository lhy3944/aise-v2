"""Agent Chat 서비스 -- SSE 스트리밍 기반 대화"""

import json
import uuid
from collections.abc import AsyncGenerator

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.glossary import GlossaryItem
from src.models.knowledge import KnowledgeChunk, KnowledgeDocument
from src.models.project import Project
from src.models.requirement import Requirement
from src.prompts.agent.chat import build_agent_chat_prompt
from src.services import embedding_svc
from src.services.llm_svc import get_srs_client, DEFAULT_MODEL
from src.services.rag_svc import search_similar_chunks


async def stream_chat(
    project_id: uuid.UUID,
    message: str,
    history: list[dict],
    db: AsyncSession,
) -> AsyncGenerator[str, None]:
    """Agent Chat SSE 스트리밍 응답 생성

    Yields SSE events:
    - data: {"type": "token", "content": "..."} -- 텍스트 토큰
    - data: {"type": "done"} -- 스트리밍 완료
    - data: {"type": "error", "content": "..."} -- 에러
    """
    try:
        # 1. 프로젝트 조회
        result = await db.execute(select(Project).where(Project.id == project_id))
        project = result.scalar_one_or_none()
        if not project:
            yield _sse_event({"type": "error", "content": "프로젝트를 찾을 수 없습니다."})
            return

        # 2. Knowledge 검색 (RAG)
        knowledge_chunks = await _fetch_knowledge_chunks(project_id, message, db)

        # 3. Glossary 조회
        glossary = await _fetch_glossary(project_id, db)

        # 4. 기존 요구사항 조회
        requirements = await _fetch_requirements(project_id, db)

        # 5. 시스템 프롬프트 빌드
        system_prompt = build_agent_chat_prompt(
            project_name=project.name,
            project_description=project.description,
            project_domain=project.domain,
            knowledge_context=knowledge_chunks,
            glossary=glossary,
            requirements=requirements,
        )

        # 6. 메시지 구성
        messages = [{"role": "system", "content": system_prompt}]
        for h in history:
            messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
        messages.append({"role": "user", "content": message})

        logger.info(
            f"Agent Chat 스트리밍 시작: project_id={project_id}, "
            f"messages={len(messages)}개, knowledge={len(knowledge_chunks)}개"
        )

        # 7. Azure OpenAI 스트리밍 호출
        client = get_srs_client()
        stream = await client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=messages,
            temperature=0.3,
            max_completion_tokens=4096,
            stream=True,
        )

        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                token = chunk.choices[0].delta.content
                yield _sse_event({"type": "token", "content": token})

        yield _sse_event({"type": "done"})
        logger.info(f"Agent Chat 스트리밍 완료: project_id={project_id}")

    except Exception as e:
        logger.error(f"Agent Chat 스트리밍 실패: {e}")
        yield _sse_event({"type": "error", "content": f"AI 응답 생성에 실패했습니다: {str(e)}"})


async def _fetch_knowledge_chunks(
    project_id: uuid.UUID,
    message: str,
    db: AsyncSession,
) -> list[dict]:
    """Knowledge Repository에서 관련 청크를 검색한다."""
    try:
        chunks_with_scores = await search_similar_chunks(project_id, message, 5, db)

        # 문서 이름 조회
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


async def _fetch_glossary(
    project_id: uuid.UUID,
    db: AsyncSession,
) -> list[dict]:
    """프로젝트 Glossary를 조회한다."""
    try:
        g_result = await db.execute(
            select(GlossaryItem)
            .where(GlossaryItem.project_id == project_id)
            .order_by(GlossaryItem.term)
        )
        return [
            {"term": g.term, "definition": g.definition}
            for g in g_result.scalars().all()
        ]
    except Exception as e:
        logger.warning(f"Glossary 조회 실패 (계속 진행): {e}")
        return []


async def _fetch_requirements(
    project_id: uuid.UUID,
    db: AsyncSession,
) -> list[dict]:
    """프로젝트의 선택된 요구사항을 조회한다."""
    try:
        r_result = await db.execute(
            select(Requirement)
            .where(Requirement.project_id == project_id)
            .where(Requirement.is_selected == True)  # noqa: E712
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
    """SSE 이벤트 문자열 생성"""
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
