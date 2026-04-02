"""Knowledge Repository API 스키마"""

import uuid
from datetime import datetime
from pydantic import BaseModel


class KnowledgeDocumentResponse(BaseModel):
    document_id: str
    project_id: str
    name: str
    file_type: str
    size_bytes: int
    status: str
    error_message: str | None = None
    chunk_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class KnowledgeDocumentListResponse(BaseModel):
    documents: list[KnowledgeDocumentResponse]
    total: int


class KnowledgeChatRequest(BaseModel):
    message: str
    history: list[dict] = []  # [{"role": "user"|"assistant", "content": "..."}]
    top_k: int = 5


class KnowledgeChatSource(BaseModel):
    document_id: str
    document_name: str
    chunk_index: int
    content: str
    score: float


class KnowledgeChatResponse(BaseModel):
    answer: str
    sources: list[KnowledgeChatSource]
