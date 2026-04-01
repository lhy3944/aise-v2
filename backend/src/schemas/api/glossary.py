from pydantic import BaseModel, Field


class GlossaryCreate(BaseModel):
    """용어 추가 요청"""
    term: str = Field(description="용어")
    definition: str = Field(description="정의")
    product_group: str | None = Field(default=None, description="제품군")


class GlossaryUpdate(BaseModel):
    """용어 수정 요청"""
    term: str | None = Field(default=None)
    definition: str | None = Field(default=None)
    product_group: str | None = Field(default=None)


class GlossaryResponse(BaseModel):
    """용어 응답"""
    glossary_id: str = Field(description="용어 ID")
    term: str = Field(description="용어")
    definition: str = Field(description="정의")
    product_group: str | None = Field(default=None, description="제품군")


class GlossaryListResponse(BaseModel):
    """용어 목록 응답"""
    glossary: list[GlossaryResponse] = Field(default_factory=list)


class GlossaryGenerateResponse(BaseModel):
    """Glossary 자동 생성 응답"""
    generated_glossary: list[GlossaryCreate] = Field(default_factory=list)
