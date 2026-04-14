"""Record 비즈니스 로직 서비스 — CRUD + 추출 + 승인"""

import uuid
from datetime import datetime, timezone

from loguru import logger
from sqlalchemy import select, func, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.exceptions import AppException
from src.models.glossary import GlossaryItem
from src.models.knowledge import KnowledgeChunk, KnowledgeDocument
from src.models.record import Record
from src.models.requirement import RequirementSection
from src.schemas.api.record import (
    RecordApproveRequest,
    RecordCreate,
    RecordExtractedItem,
    RecordExtractResponse,
    RecordListResponse,
    RecordReorderRequest,
    RecordResponse,
    RecordStatusUpdate,
    RecordUpdate,
)
from src.services.llm_svc import chat_completion
from src.utils.json_parser import parse_llm_json


def _to_response(record: Record) -> RecordResponse:
    section_name = None
    if hasattr(record, "section") and record.section:
        section_name = record.section.name
    source_doc_name = None
    if hasattr(record, "source_document") and record.source_document:
        source_doc_name = record.source_document.name

    return RecordResponse(
        record_id=str(record.id),
        project_id=str(record.project_id),
        section_id=str(record.section_id) if record.section_id else None,
        section_name=section_name,
        content=record.content,
        display_id=record.display_id,
        source_document_id=str(record.source_document_id) if record.source_document_id else None,
        source_document_name=source_doc_name,
        source_location=record.source_location,
        confidence_score=record.confidence_score,
        status=record.status,
        is_auto_extracted=record.is_auto_extracted,
        order_index=record.order_index,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


async def _next_display_id(db: AsyncSession, project_id: uuid.UUID, section_type: str) -> str:
    """섹션 타입 기반 display_id 자동 생성 (예: FR-001)"""
    prefix_map = {
        "overview": "OVR", "fr": "FR", "qa": "QA",
        "constraints": "CON", "interfaces": "IF", "other": "OTH",
    }
    prefix = prefix_map.get(section_type, section_type[:3].upper())

    result = await db.execute(
        select(Record.display_id)
        .where(Record.project_id == project_id, Record.display_id.like(f"{prefix}-%"))
    )
    existing = result.scalars().all()

    max_num = 0
    for did in existing:
        try:
            num = int(did.split("-")[-1])
            max_num = max(max_num, num)
        except (ValueError, IndexError):
            pass

    return f"{prefix}-{max_num + 1:03d}"


async def _next_order_index(db: AsyncSession, project_id: uuid.UUID) -> int:
    result = await db.execute(
        select(func.max(Record.order_index)).where(Record.project_id == project_id)
    )
    max_idx = result.scalar()
    return (max_idx + 1) if max_idx is not None else 0


def _record_query(project_id: uuid.UUID, section_id: str | None = None):
    stmt = (
        select(Record)
        .options(selectinload(Record.section), selectinload(Record.source_document))
        .where(Record.project_id == project_id)
    )
    if section_id:
        stmt = stmt.where(Record.section_id == uuid.UUID(section_id))
    return stmt.order_by(Record.order_index.asc())


# ── CRUD ──

async def list_records(
    db: AsyncSession, project_id: uuid.UUID, section_id: str | None = None,
) -> RecordListResponse:
    result = await db.execute(_record_query(project_id, section_id))
    records = result.scalars().all()
    return RecordListResponse(records=[_to_response(r) for r in records], total=len(records))


async def create_record(
    db: AsyncSession, project_id: uuid.UUID, data: RecordCreate,
) -> RecordResponse:
    # 섹션 타입 조회
    section_type = "other"
    if data.section_id:
        sec = await db.get(RequirementSection, uuid.UUID(data.section_id))
        if sec:
            section_type = sec.type

    display_id = await _next_display_id(db, project_id, section_type)
    order_index = await _next_order_index(db, project_id)

    record = Record(
        project_id=project_id,
        section_id=uuid.UUID(data.section_id) if data.section_id else None,
        content=data.content,
        display_id=display_id,
        source_document_id=uuid.UUID(data.source_document_id) if data.source_document_id else None,
        source_location=data.source_location,
        order_index=order_index,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return _to_response(record)


async def update_record(
    db: AsyncSession, project_id: uuid.UUID, record_id: uuid.UUID, data: RecordUpdate,
) -> RecordResponse:
    record = await db.get(Record, record_id)
    if not record or record.project_id != project_id:
        raise AppException(404, "레코드를 찾을 수 없습니다.")

    update_data = data.model_dump(exclude_unset=True)
    if "section_id" in update_data and update_data["section_id"]:
        update_data["section_id"] = uuid.UUID(update_data["section_id"])
    for key, value in update_data.items():
        setattr(record, key, value)

    record.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(record)
    return _to_response(record)


async def update_record_status(
    db: AsyncSession, project_id: uuid.UUID, record_id: uuid.UUID, data: RecordStatusUpdate,
) -> RecordResponse:
    record = await db.get(Record, record_id)
    if not record or record.project_id != project_id:
        raise AppException(404, "레코드를 찾을 수 없습니다.")

    record.status = data.status
    record.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(record)
    return _to_response(record)


async def delete_record(
    db: AsyncSession, project_id: uuid.UUID, record_id: uuid.UUID,
) -> None:
    record = await db.get(Record, record_id)
    if not record or record.project_id != project_id:
        raise AppException(404, "레코드를 찾을 수 없습니다.")
    await db.delete(record)
    await db.commit()


async def reorder_records(
    db: AsyncSession, project_id: uuid.UUID, data: RecordReorderRequest,
) -> int:
    if not data.ordered_ids:
        return 0

    seen: set[str] = set()
    unique_ids = [sid for sid in data.ordered_ids if sid not in seen and not seen.add(sid)]
    record_uuids = [uuid.UUID(sid) for sid in unique_ids]

    stmt = select(Record).where(Record.project_id == project_id, Record.id.in_(record_uuids))
    result = await db.execute(stmt)
    records = {str(r.id): r for r in result.scalars().all()}

    now = datetime.now(timezone.utc)
    updated = 0
    for idx, rid in enumerate(unique_ids):
        record = records.get(rid)
        if record and record.order_index != idx:
            record.order_index = idx
            record.updated_at = now
            updated += 1

    await db.commit()
    return updated


# ── 추출 ──

async def extract_records(
    db: AsyncSession, project_id: uuid.UUID, section_id: str | None = None,
) -> RecordExtractResponse:
    """지식 문서 기반 레코드 추출 (전체 또는 특정 섹션)"""
    logger.info(f"레코드 추출 시작: project_id={project_id}, section_id={section_id}")

    # 1. 활성 섹션 조회
    sect_stmt = select(RequirementSection).where(
        RequirementSection.project_id == project_id,
        RequirementSection.is_active == True,  # noqa: E712
    ).order_by(RequirementSection.order_index)
    if section_id:
        sect_stmt = sect_stmt.where(RequirementSection.id == uuid.UUID(section_id))

    sections = (await db.execute(sect_stmt)).scalars().all()
    if not sections:
        raise AppException(400, "활성 섹션이 없습니다.")

    # 2. 활성 지식 문서 청크
    chunk_stmt = (
        select(KnowledgeChunk.content, KnowledgeDocument.id, KnowledgeDocument.name)
        .join(KnowledgeDocument, KnowledgeChunk.document_id == KnowledgeDocument.id)
        .where(
            KnowledgeDocument.project_id == project_id,
            KnowledgeDocument.is_active == True,  # noqa: E712
            KnowledgeDocument.status == "completed",
        )
        .order_by(KnowledgeDocument.id, KnowledgeChunk.chunk_index)
    )
    rows = (await db.execute(chunk_stmt)).all()
    if not rows:
        raise AppException(400, "활성 지식 문서가 없습니다.")

    # 문서별 텍스트
    doc_map: dict[str, dict] = {}
    for content, doc_id, doc_name in rows:
        did = str(doc_id)
        if did not in doc_map:
            doc_map[did] = {"name": doc_name, "chunks": []}
        doc_map[did]["chunks"].append(content)

    document_text = "\n\n".join(
        f"[문서: {info['name']}]\n" + "\n".join(info["chunks"][:20])
        for info in doc_map.values()
    )

    # 3. 용어 사전
    glossary_result = await db.execute(
        select(GlossaryItem.term, GlossaryItem.definition)
        .where(GlossaryItem.project_id == project_id, GlossaryItem.is_approved == True)  # noqa: E712
    )
    glossary_items = glossary_result.all()
    glossary_text = "\n".join(f"- {t}: {d}" for t, d in glossary_items) if glossary_items else "(없음)"

    # 4. 섹션 정의
    sections_text = "\n".join(
        f"- {s.name} (type: {s.type}): {s.description or '설명 없음'}"
        + (f" [출력 형식: {s.output_format_hint}]" if s.output_format_hint else "")
        for s in sections
    )

    section_ids_map = {s.name: {"id": str(s.id), "type": s.type} for s in sections}

    # 5. LLM 호출
    messages = [
        {"role": "system", "content": "JSON 형식으로만 응답하세요."},
        {"role": "user", "content": f"""\
아래 지식 문서에서 섹션별 레코드를 추출하세요.

규칙:
- 각 레코드는 하나의 독립적인 요구사항/제약/속성/설명 단위여야 합니다
- 원문에 없는 내용을 생성하지 마세요
- 각 레코드에 출처(문서명, 위치)를 반드시 명시하세요
- 신뢰도 점수(0.0~1.0)를 부여하세요 (명확한 내용: 0.8+, 모호한 내용: 0.5 이하)
- 입력 언어와 동일한 언어로 응답하세요

출력 형식:
{{"records": [
  {{"section_name": "섹션명", "content": "레코드 내용", "source_document": "문서명", "source_location": "위치 정보", "confidence": 0.85}}
]}}

섹션 목록:
{sections_text}

용어 사전:
{glossary_text}

지식 문서:
{document_text}"""},
    ]

    raw = await chat_completion(messages, temperature=0.2, max_completion_tokens=8192)
    parsed = parse_llm_json(raw, error_msg="LLM 응답 파싱 실패")
    items = parsed.get("records", [])

    # 6. 응답 매핑
    candidates = []
    for item in items:
        sec_name = item.get("section_name", "")
        sec_info = section_ids_map.get(sec_name, {})

        # source_document_name → source_document_id 매핑
        src_doc_name = item.get("source_document", "")
        src_doc_id = None
        for did, info in doc_map.items():
            if info["name"] == src_doc_name:
                src_doc_id = did
                break

        candidates.append(RecordExtractedItem(
            content=item.get("content", ""),
            section_id=sec_info.get("id"),
            section_name=sec_name,
            source_document_id=src_doc_id,
            source_document_name=src_doc_name,
            source_location=item.get("source_location"),
            confidence_score=item.get("confidence"),
        ))

    logger.info(f"레코드 추출 완료: {len(candidates)}개 후보")
    return RecordExtractResponse(candidates=candidates)


async def get_record_by_display_id(
    db: AsyncSession, project_id: uuid.UUID, display_id: str,
) -> Record | None:
    """display_id(예: FR-001)로 레코드 조회"""
    stmt = (
        select(Record)
        .options(selectinload(Record.section), selectinload(Record.source_document))
        .where(Record.project_id == project_id, Record.display_id == display_id)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def search_records(
    db: AsyncSession, project_id: uuid.UUID, query: str,
    section_name: str | None = None, limit: int = 10,
) -> list[RecordResponse]:
    """키워드 검색 — content ILIKE 또는 display_id 매칭"""
    stmt = (
        select(Record)
        .options(selectinload(Record.section), selectinload(Record.source_document))
        .where(Record.project_id == project_id)
    )

    if section_name:
        stmt = stmt.join(Record.section).where(RequirementSection.name.ilike(f"%{section_name}%"))

    # display_id 정확 매칭 또는 content ILIKE 검색
    stmt = stmt.where(
        Record.display_id.ilike(f"%{query}%") | Record.content.ilike(f"%{query}%")
    )
    stmt = stmt.order_by(Record.order_index.asc()).limit(limit)

    result = await db.execute(stmt)
    return [_to_response(r) for r in result.scalars().all()]


async def get_section_by_name(
    db: AsyncSession, project_id: uuid.UUID, section_name: str,
) -> RequirementSection | None:
    """섹션 이름으로 조회 (ILIKE)"""
    stmt = (
        select(RequirementSection)
        .where(
            RequirementSection.project_id == project_id,
            RequirementSection.name.ilike(f"%{section_name}%"),
            RequirementSection.is_active == True,  # noqa: E712
        )
    )
    result = await db.execute(stmt)
    return result.scalars().first()


async def approve_records(
    db: AsyncSession, project_id: uuid.UUID, data: RecordApproveRequest,
) -> RecordListResponse:
    """추출된 레코드 후보 일괄 승인 저장"""
    logger.info(f"레코드 승인: project_id={project_id}, count={len(data.items)}")

    created = []
    for item_data in data.items:
        section_type = "other"
        if item_data.section_id:
            sec = await db.get(RequirementSection, uuid.UUID(item_data.section_id))
            if sec:
                section_type = sec.type

        display_id = await _next_display_id(db, project_id, section_type)
        order_index = await _next_order_index(db, project_id)

        record = Record(
            project_id=project_id,
            section_id=uuid.UUID(item_data.section_id) if item_data.section_id else None,
            content=item_data.content,
            display_id=display_id,
            source_document_id=uuid.UUID(item_data.source_document_id) if item_data.source_document_id else None,
            source_location=item_data.source_location,
            status="approved",
            is_auto_extracted=True,
            order_index=order_index,
        )
        db.add(record)
        created.append(record)

    await db.commit()
    for r in created:
        await db.refresh(r)

    return RecordListResponse(records=[_to_response(r) for r in created], total=len(created))
