"""RequirementSection 비즈니스 로직 서비스"""

import uuid
from datetime import datetime, timezone

from loguru import logger
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.project import Project
from src.models.requirement import RequirementSection
from src.schemas.api.common import RequirementType
from src.schemas.api.requirement import (
    SectionCreate,
    SectionUpdate,
    SectionReorderRequest,
    SectionResponse,
)
from src.utils.db import get_or_404


def _to_response(section: RequirementSection) -> SectionResponse:
    """RequirementSection 모델을 응답 스키마로 변환"""
    return SectionResponse(
        section_id=str(section.id),
        name=section.name,
        type=section.type,
        order_index=section.order_index,
        created_at=section.created_at.isoformat(),
        updated_at=section.updated_at.isoformat(),
    )


async def _next_order_index(
    db: AsyncSession,
    project_id: uuid.UUID,
    type_filter: str,
) -> int:
    """프로젝트+타입 내 다음 order_index 반환"""
    stmt = (
        select(func.max(RequirementSection.order_index))
        .where(
            RequirementSection.project_id == project_id,
            RequirementSection.type == type_filter,
        )
    )
    result = await db.execute(stmt)
    max_idx = result.scalar()
    return (max_idx + 1) if max_idx is not None else 0


async def get_sections(
    db: AsyncSession,
    project_id: uuid.UUID,
    type_filter: RequirementType | None = None,
) -> list[SectionResponse]:
    """프로젝트의 섹션 목록 조회 (type 필터링 지원)"""
    stmt = select(RequirementSection).where(RequirementSection.project_id == project_id)
    if type_filter is not None:
        stmt = stmt.where(RequirementSection.type == type_filter.value)
    stmt = stmt.order_by(RequirementSection.order_index.asc())

    result = await db.execute(stmt)
    sections = result.scalars().all()

    logger.info(f"섹션 목록 조회: project_id={project_id}, type={type_filter}, count={len(sections)}")
    return [_to_response(s) for s in sections]


async def create_section(
    db: AsyncSession,
    project_id: uuid.UUID,
    data: SectionCreate,
) -> SectionResponse:
    """섹션 생성"""
    await get_or_404(
        db, Project, Project.id == project_id,
        error_msg="프로젝트를 찾을 수 없습니다.",
    )

    order_index = await _next_order_index(db, project_id, data.type.value)

    section = RequirementSection(
        project_id=project_id,
        type=data.type.value,
        name=data.name,
        order_index=order_index,
    )
    db.add(section)
    await db.commit()
    await db.refresh(section)

    logger.info(f"섹션 생성: id={section.id}, name={data.name}, type={data.type.value}, project_id={project_id}")
    return _to_response(section)


async def update_section(
    db: AsyncSession,
    project_id: uuid.UUID,
    section_id: uuid.UUID,
    data: SectionUpdate,
) -> SectionResponse:
    """섹션 수정"""
    section = await get_or_404(
        db, RequirementSection,
        RequirementSection.id == section_id,
        RequirementSection.project_id == project_id,
        error_msg="섹션을 찾을 수 없습니다.",
    )

    section.name = data.name
    section.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(section)

    logger.info(f"섹션 수정: id={section_id}, name={data.name}")
    return _to_response(section)


async def delete_section(
    db: AsyncSession,
    project_id: uuid.UUID,
    section_id: uuid.UUID,
) -> None:
    """섹션 삭제 (FK SET NULL로 하위 요구사항의 section_id가 NULL 처리됨)"""
    section = await get_or_404(
        db, RequirementSection,
        RequirementSection.id == section_id,
        RequirementSection.project_id == project_id,
        error_msg="섹션을 찾을 수 없습니다.",
    )

    await db.delete(section)
    await db.commit()

    logger.info(f"섹션 삭제: id={section_id}, project_id={project_id}")


async def reorder_sections(
    db: AsyncSession,
    project_id: uuid.UUID,
    data: SectionReorderRequest,
) -> int:
    """섹션 순서 변경. 실제 변경된 건수를 반환."""
    if not data.ordered_ids:
        return 0

    # 중복 ID 제거
    seen: set[str] = set()
    unique_ids: list[str] = []
    for sid in data.ordered_ids:
        if sid not in seen:
            seen.add(sid)
            unique_ids.append(sid)

    section_uuids = [uuid.UUID(sid) for sid in unique_ids]

    stmt = select(RequirementSection).where(
        RequirementSection.project_id == project_id,
        RequirementSection.id.in_(section_uuids),
    )
    result = await db.execute(stmt)
    sections = {str(s.id): s for s in result.scalars().all()}

    now = datetime.now(timezone.utc)
    updated = 0
    for idx, sid in enumerate(unique_ids):
        section = sections.get(sid)
        if section and section.order_index != idx:
            section.order_index = idx
            section.updated_at = now
            updated += 1

    await db.commit()

    logger.info(f"섹션 순서 변경: project_id={project_id}, updated={updated}")
    return updated
