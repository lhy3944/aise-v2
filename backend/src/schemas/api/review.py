"""Review API 스키마 -- 요구사항/UCD/UCS/TC Review 공용."""

from typing import Literal

from pydantic import BaseModel, Field


# ── 요구사항 Review ──


class ReviewRequest(BaseModel):
    """요구사항 Review 요청"""
    requirement_ids: list[str] = Field(description="리뷰 대상 요구사항 ID 목록")


class ReviewSuggestion(BaseModel):
    """Review 수정 제안"""
    target_id: str = Field(description="수정 대상 ID")
    original_text: str = Field(description="기존 문장")
    suggested_text: str = Field(description="수정 제안 문장")


class ReviewIssue(BaseModel):
    """Review에서 발견된 이슈"""
    issue_id: str = Field(description="이슈 ID")
    type: Literal["conflict", "duplicate", "ambiguity"] = Field(description="이슈 유형")
    severity: Literal["high", "medium", "low"] = Field(default="medium", description="심각도")
    description: str = Field(description="이슈 설명")
    related_requirements: list[str] = Field(default_factory=list, description="관련 요구사항 ID")
    suggestion: ReviewSuggestion | None = Field(default=None, description="수정 제안")


class ReviewSummary(BaseModel):
    """Review 요약"""
    total_issues: int = Field(default=0)
    conflicts: int = Field(default=0)
    duplicates: int = Field(default=0)
    ambiguities: int = Field(default=0)
    ready_for_next: bool = Field(default=False, description="다음 단계 진행 가능 여부")
    feedback: str = Field(default="", description="종합 피드백")


class ReviewResponse(BaseModel):
    """Review 결과 응답"""
    issues: list[ReviewIssue] = Field(default_factory=list)
    summary: ReviewSummary = Field(description="요약")
