"""Glossary 비즈니스 로직 서비스"""

import uuid

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import AppException
from src.models.glossary import GlossaryItem
from src.models.project import Project
from src.models.requirement import Requirement
from src.schemas.api.glossary import (
    GlossaryCreate,
    GlossaryGenerateResponse,
    GlossaryListResponse,
    GlossaryResponse,
    GlossaryUpdate,
)
from src.prompts.glossary import build_glossary_generate_prompt
from src.services.llm_svc import chat_completion
from src.utils.db import get_or_404
from src.utils.json_parser import parse_llm_json


def _to_response(item: GlossaryItem) -> GlossaryResponse:
    """DB 모델 -> 응답 스키마 변환"""
    return GlossaryResponse(
        glossary_id=str(item.id),
        term=item.term,
        definition=item.definition,
        product_group=item.product_group,
    )


async def list_glossary(db: AsyncSession, project_id: uuid.UUID) -> GlossaryListResponse:
    """프로젝트의 용어 목록 조회"""
    logger.info(f"Glossary 목록 조회: project_id={project_id}")

    result = await db.execute(
        select(GlossaryItem)
        .where(GlossaryItem.project_id == project_id)
        .order_by(GlossaryItem.term)
    )
    items = result.scalars().all()

    return GlossaryListResponse(glossary=[_to_response(item) for item in items])


async def create_glossary(
    db: AsyncSession, project_id: uuid.UUID, data: GlossaryCreate
) -> GlossaryResponse:
    """용어 추가"""
    logger.info(f"Glossary 추가: project_id={project_id}, term={data.term}")

    # W-10: 프로젝트 존재 확인
    await get_or_404(
        db, Project, Project.id == project_id,
        error_msg="프로젝트를 찾을 수 없습니다.",
    )

    item = GlossaryItem(
        project_id=project_id,
        term=data.term,
        definition=data.definition,
        product_group=data.product_group,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    return _to_response(item)


async def update_glossary(
    db: AsyncSession,
    project_id: uuid.UUID,
    glossary_id: uuid.UUID,
    data: GlossaryUpdate,
) -> GlossaryResponse:
    """용어 수정"""
    logger.info(f"Glossary 수정: glossary_id={glossary_id}")

    item = await get_or_404(
        db, GlossaryItem,
        GlossaryItem.id == glossary_id,
        GlossaryItem.project_id == project_id,
        error_msg="용어를 찾을 수 없습니다.",
    )

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)

    await db.commit()
    await db.refresh(item)

    return _to_response(item)


async def delete_glossary(
    db: AsyncSession, project_id: uuid.UUID, glossary_id: uuid.UUID
) -> None:
    """용어 삭제"""
    logger.info(f"Glossary 삭제: glossary_id={glossary_id}")

    item = await get_or_404(
        db, GlossaryItem,
        GlossaryItem.id == glossary_id,
        GlossaryItem.project_id == project_id,
        error_msg="용어를 찾을 수 없습니다.",
    )
    await db.delete(item)
    await db.commit()


async def generate_glossary(
    db: AsyncSession, project_id: uuid.UUID
) -> GlossaryGenerateResponse:
    """프로젝트 요구사항 기반 Glossary 초안 자동 생성 (LLM)"""
    logger.info(f"Glossary 자동 생성 시작: project_id={project_id}")

    # 프로젝트의 모든 요구사항 텍스트 수집
    result = await db.execute(
        select(Requirement).where(Requirement.project_id == project_id)
    )
    requirements = result.scalars().all()

    if not requirements:
        raise AppException(400, "용어를 생성할 요구사항이 없습니다.")

    req_texts = []
    for req in requirements:
        text = req.refined_text or req.original_text
        req_texts.append(f"[{req.type.upper()}] {text}")

    requirements_block = "\n".join(req_texts)

    messages = build_glossary_generate_prompt(requirements_block)

    raw = await chat_completion(messages, temperature=0.3, max_completion_tokens=4096)

    # W-08: 공통 JSON 파서 사용
    parsed = parse_llm_json(raw, error_msg="LLM 응답을 파싱할 수 없습니다.")
    items = parsed.get("glossary", [])

    generated = [
        GlossaryCreate(
            term=item["term"],
            definition=item["definition"],
            product_group=item.get("product_group"),
        )
        for item in items
    ]

    logger.info(f"Glossary 자동 생성 완료: {len(generated)}개 용어 추출")
    return GlossaryGenerateResponse(generated_glossary=generated)
