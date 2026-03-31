"""요구사항 Review 라우터 -- 충돌/중복/모호성 검출 API."""

import uuid

from fastapi import APIRouter, Depends
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.schemas.api.review import ReviewRequest, ReviewResponse
from src.services.review_svc import review_requirements

router = APIRouter(
    prefix="/api/v1/projects/{project_id}/review",
    tags=["review"],
)


@router.post("/requirements", response_model=ReviewResponse)
async def review_requirements_endpoint(
    project_id: uuid.UUID,
    request: ReviewRequest,
    db: AsyncSession = Depends(get_db),
):
    """요구사항을 분석하여 충돌/중복/모호성을 검출한다."""
    logger.info(f"POST /review/requirements | project_id={project_id}")
    return await review_requirements(
        requirement_ids=request.requirement_ids,
        project_id=project_id,
        db=db,
    )
