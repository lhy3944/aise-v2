"""Requirement Section CRUD API 라우터"""

import uuid

from fastapi import APIRouter, Depends, Query
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.schemas.api.common import RequirementType
from src.schemas.api.requirement import (
    SectionCreate,
    SectionUpdate,
    SectionReorderRequest,
    SectionResponse,
    SectionListResponse,
)
from src.services import section_svc

router = APIRouter(
    prefix="/api/v1/projects/{project_id}/requirement-sections",
    tags=["requirement-sections"],
)


@router.get("", response_model=SectionListResponse)
async def list_sections(
    project_id: uuid.UUID,
    type: RequirementType | None = Query(default=None, description="요구사항 유형 필터 (fr, qa, constraints, other)"),
    db: AsyncSession = Depends(get_db),
):
    """프로젝트의 요구사항 섹션 목록 조회"""
    sections = await section_svc.get_sections(db, project_id, type_filter=type)
    return SectionListResponse(sections=sections)


@router.post("", response_model=SectionResponse, status_code=201)
async def create_section(
    project_id: uuid.UUID,
    body: SectionCreate,
    db: AsyncSession = Depends(get_db),
):
    """요구사항 섹션 생성"""
    return await section_svc.create_section(db, project_id, body)


@router.put("/reorder", response_model=dict)
async def reorder_sections(
    project_id: uuid.UUID,
    body: SectionReorderRequest,
    db: AsyncSession = Depends(get_db),
):
    """요구사항 섹션 순서 변경"""
    updated_count = await section_svc.reorder_sections(db, project_id, body)
    return {"updated_count": updated_count}


@router.put("/{section_id}", response_model=SectionResponse)
async def update_section(
    project_id: uuid.UUID,
    section_id: uuid.UUID,
    body: SectionUpdate,
    db: AsyncSession = Depends(get_db),
):
    """요구사항 섹션 수정"""
    return await section_svc.update_section(db, project_id, section_id, body)


@router.delete("/{section_id}", status_code=204)
async def delete_section(
    project_id: uuid.UUID,
    section_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """요구사항 섹션 삭제"""
    await section_svc.delete_section(db, project_id, section_id)
