from pydantic import BaseModel, Field


class SRSGenerateRequest(BaseModel):
    """SRS 문서 생성 요청"""
    requirement_version: int | None = Field(default=None, description="요구사항 버전 (없으면 최신)")


class SRSSection(BaseModel):
    """SRS 문서 섹션"""
    title: str = Field(description="섹션 제목")
    content: str = Field(description="섹션 내용")


class SRSResponse(BaseModel):
    """SRS 문서 응답"""
    srs_id: str = Field(description="SRS ID")
    version: int = Field(description="SRS 버전")
    sections: list[SRSSection] = Field(default_factory=list, description="문서 섹션")
    source_requirements_version: int = Field(description="기반 요구사항 버전")
    generated_at: str = Field(description="생성 일시")


class SRSListResponse(BaseModel):
    """SRS 목록 응답"""
    srs_list: list[SRSResponse] = Field(default_factory=list)
