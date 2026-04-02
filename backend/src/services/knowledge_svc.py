"""Knowledge Repository 서비스 -- 문서 업로드/조회/삭제"""

import uuid

from fastapi import BackgroundTasks, UploadFile
from loguru import logger
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import AppException
from src.models.knowledge import KnowledgeDocument
from src.schemas.api.knowledge import (
    KnowledgeDocumentListResponse,
    KnowledgeDocumentResponse,
)
from src.services import storage_svc
from src.services.document_processor import process_document

ALLOWED_FILE_TYPES = {"pdf", "docx", "pptx", "xlsx", "txt", "md"}

# Content-Type 매핑
CONTENT_TYPE_MAP = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "txt": "text/plain",
    "md": "text/markdown",
}


def _to_response(doc: KnowledgeDocument) -> KnowledgeDocumentResponse:
    """DB 모델 -> 응답 스키마 변환"""
    return KnowledgeDocumentResponse(
        document_id=str(doc.id),
        project_id=str(doc.project_id),
        name=doc.name,
        file_type=doc.file_type,
        size_bytes=doc.size_bytes,
        status=doc.status,
        error_message=doc.error_message,
        chunk_count=doc.chunk_count,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


def _get_file_type(filename: str) -> str:
    """파일 확장자에서 타입 추출"""
    if not filename or "." not in filename:
        raise AppException(400, "파일 확장자를 확인할 수 없습니다.")
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_FILE_TYPES:
        raise AppException(
            400,
            f"지원하지 않는 파일 형식입니다: .{ext} (지원: {', '.join(sorted(ALLOWED_FILE_TYPES))})",
        )
    return ext


async def upload_document(
    project_id: uuid.UUID,
    file: UploadFile,
    db: AsyncSession,
    background_tasks: BackgroundTasks,
) -> KnowledgeDocumentResponse:
    """문서 업로드 + 비동기 처리 시작"""
    logger.info(f"문서 업로드: project_id={project_id}, filename={file.filename}")

    # 1. 파일 타입 검증
    file_type = _get_file_type(file.filename or "")

    # 2. 파일 읽기
    file_bytes = await file.read()
    if not file_bytes:
        raise AppException(400, "빈 파일은 업로드할 수 없습니다.")

    # 3. 스토리지 키 생성 및 업로드
    document_id = uuid.uuid4()
    storage_key = f"{project_id}/{document_id}/{file.filename}"
    bucket = storage_svc.get_default_bucket()
    content_type = CONTENT_TYPE_MAP.get(file_type, "application/octet-stream")

    await storage_svc.upload_file(bucket, storage_key, file_bytes, content_type)

    # 4. DB 레코드 생성
    doc = KnowledgeDocument(
        id=document_id,
        project_id=project_id,
        name=file.filename or "unknown",
        file_type=file_type,
        size_bytes=len(file_bytes),
        storage_key=storage_key,
        status="processing",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # 5. 백그라운드에서 문서 처리 시작
    background_tasks.add_task(process_document, document_id, db)

    logger.info(f"문서 업로드 완료: document_id={document_id}, status=processing")
    return _to_response(doc)


async def list_documents(
    project_id: uuid.UUID,
    db: AsyncSession,
) -> KnowledgeDocumentListResponse:
    """프로젝트의 문서 목록 조회"""
    logger.info(f"문서 목록 조회: project_id={project_id}")

    result = await db.execute(
        select(KnowledgeDocument)
        .where(KnowledgeDocument.project_id == project_id)
        .order_by(KnowledgeDocument.created_at.desc())
    )
    docs = result.scalars().all()

    return KnowledgeDocumentListResponse(
        documents=[_to_response(doc) for doc in docs],
        total=len(docs),
    )


async def get_document(
    project_id: uuid.UUID,
    document_id: uuid.UUID,
    db: AsyncSession,
) -> KnowledgeDocumentResponse:
    """문서 상세 조회"""
    logger.info(f"문서 조회: document_id={document_id}")

    result = await db.execute(
        select(KnowledgeDocument).where(
            KnowledgeDocument.id == document_id,
            KnowledgeDocument.project_id == project_id,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise AppException(404, "문서를 찾을 수 없습니다.")

    return _to_response(doc)


async def delete_document(
    project_id: uuid.UUID,
    document_id: uuid.UUID,
    db: AsyncSession,
) -> None:
    """문서 삭제 (DB + MinIO)"""
    logger.info(f"문서 삭제: document_id={document_id}")

    result = await db.execute(
        select(KnowledgeDocument).where(
            KnowledgeDocument.id == document_id,
            KnowledgeDocument.project_id == project_id,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise AppException(404, "문서를 찾을 수 없습니다.")

    # MinIO에서 파일 삭제
    bucket = storage_svc.get_default_bucket()
    try:
        await storage_svc.delete_file(bucket, doc.storage_key)
    except Exception as e:
        logger.warning(f"MinIO 파일 삭제 실패 (계속 진행): {e}")

    # DB에서 삭제 (cascade로 chunks도 삭제)
    await db.delete(doc)
    await db.commit()

    logger.info(f"문서 삭제 완료: document_id={document_id}")
