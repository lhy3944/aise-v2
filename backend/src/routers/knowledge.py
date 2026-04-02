"""Knowledge Repository API 라우터"""

import uuid

from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.schemas.api.knowledge import (
    KnowledgeChatRequest,
    KnowledgeChatResponse,
    KnowledgeDocumentListResponse,
    KnowledgeDocumentResponse,
)
from src.services import knowledge_svc, rag_svc

router = APIRouter(prefix="/api/v1/projects/{project_id}/knowledge", tags=["knowledge"])


@router.post("/documents", response_model=KnowledgeDocumentResponse, status_code=201)
async def upload_document(
    project_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    return await knowledge_svc.upload_document(project_id, file, db, background_tasks)


@router.get("/documents", response_model=KnowledgeDocumentListResponse)
async def list_documents(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    return await knowledge_svc.list_documents(project_id, db)


@router.get("/documents/{document_id}", response_model=KnowledgeDocumentResponse)
async def get_document(
    project_id: uuid.UUID,
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    return await knowledge_svc.get_document(project_id, document_id, db)


@router.delete("/documents/{document_id}", status_code=204)
async def delete_document(
    project_id: uuid.UUID,
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    await knowledge_svc.delete_document(project_id, document_id, db)


@router.post("/chat", response_model=KnowledgeChatResponse)
async def knowledge_chat(
    project_id: uuid.UUID,
    body: KnowledgeChatRequest,
    db: AsyncSession = Depends(get_db),
):
    return await rag_svc.chat(project_id, body.message, body.history, body.top_k, db)
