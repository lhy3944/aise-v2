"""요구사항 Review 서비스 -- 충돌/중복/모호성 검출."""

import uuid

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import AppException
from src.models.requirement import Requirement
from src.prompts.review import build_requirements_review_prompt
from src.schemas.api.review import (
    ReviewIssue,
    ReviewResponse,
    ReviewSuggestion,
    ReviewSummary,
)
from src.services.llm_svc import chat_completion
from src.utils.json_parser import parse_llm_json


async def review_requirements(
    requirement_ids: list[str],
    project_id: uuid.UUID,
    db: AsyncSession,
) -> ReviewResponse:
    """요구사항을 분석하여 충돌/중복/모호성 이슈를 검출한다."""
    logger.info(f"Review 요청: project_id={project_id}, ids={len(requirement_ids)}개")

    # requirement_ids -> UUID 변환
    try:
        uuids = [uuid.UUID(rid) for rid in requirement_ids]
    except ValueError:
        raise AppException(status_code=400, detail="유효하지 않은 requirement_id가 포함되어 있습니다.")

    # DB에서 요구사항 조회
    stmt = (
        select(Requirement)
        .where(Requirement.project_id == project_id)
        .where(Requirement.id.in_(uuids))
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()

    if not rows:
        raise AppException(status_code=404, detail="해당하는 요구사항을 찾을 수 없습니다.")

    found_ids = {str(r.id) for r in rows}
    missing = [rid for rid in requirement_ids if rid not in found_ids]
    if missing:
        logger.warning(f"조회되지 않은 requirement_id: {missing}")

    # 프롬프트용 데이터 구성 (req_id 포함하여 LLM이 참조할 수 있게)
    requirements_data = [
        {
            "req_id": str(r.id),
            "type": r.type,
            "text": r.refined_text or r.original_text,
        }
        for r in rows
    ]

    messages = build_requirements_review_prompt(requirements_data)
    raw = await chat_completion(messages, client_type="srs", temperature=0.3, max_completion_tokens=4096)

    parsed = parse_llm_json(raw, error_msg="AI 응답을 파싱할 수 없습니다.")

    # issues 파싱
    raw_issues = parsed.get("issues", [])
    if not isinstance(raw_issues, list):
        logger.error(f"LLM 응답의 issues가 리스트가 아님: {type(raw_issues)}")
        raise AppException(status_code=502, detail="AI 응답 형식이 올바르지 않습니다.")

    issues = []
    for item in raw_issues:
        try:
            suggestion = None
            if item.get("suggestion"):
                s = item["suggestion"]
                suggestion = ReviewSuggestion(
                    target_id=s["target_id"],
                    original_text=s["original_text"],
                    suggested_text=s["suggested_text"],
                )
            issues.append(
                ReviewIssue(
                    issue_id=uuid.uuid4().hex[:8],
                    type=item["type"],
                    severity=item["severity"],
                    description=item["description"],
                    related_requirements=item.get("related_requirements", []),
                    suggestion=suggestion,
                )
            )
        except (KeyError, ValueError) as exc:
            logger.warning(f"이슈 항목 파싱 스킵: {exc}, item={item}")
            continue

    # summary 파싱
    raw_summary = parsed.get("summary", {})
    if not isinstance(raw_summary, dict):
        logger.error(f"LLM 응답의 summary가 dict가 아님: {type(raw_summary)}")
        raise AppException(status_code=502, detail="AI 응답 형식이 올바르지 않습니다.")

    # LLM의 total_issues 대신 실제 파싱된 이슈 수 사용 (파싱 스킵으로 불일치 가능)
    conflict_count = sum(1 for i in issues if i.type == "conflict")
    duplicate_count = sum(1 for i in issues if i.type == "duplicate")
    ambiguity_count = sum(1 for i in issues if i.type == "ambiguity")

    summary = ReviewSummary(
        total_issues=len(issues),
        conflicts=conflict_count,
        duplicates=duplicate_count,
        ambiguities=ambiguity_count,
        ready_for_next=raw_summary.get("ready_for_next", len(issues) == 0),
        feedback=raw_summary.get("feedback", ""),
    )

    logger.info(f"Review 완료: {len(issues)}개 이슈 검출, ready_for_next={summary.ready_for_next}")
    return ReviewResponse(issues=issues, summary=summary)
