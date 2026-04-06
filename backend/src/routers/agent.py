"""Agent Chat API 라우터"""

import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.schemas.api.agent import AgentChatRequest
from src.services import agent_svc

router = APIRouter(prefix="/api/v1/agent", tags=["agent"])


@router.post("/chat")
async def agent_chat(
    body: AgentChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """Agent Chat SSE 스트리밍 엔드포인트

    SSE 이벤트 형식:
    - data: {"type": "token", "content": "..."} -- 텍스트 토큰
    - data: {"type": "done"} -- 스트리밍 완료
    - data: {"type": "error", "content": "..."} -- 에러
    """
    project_id = uuid.UUID(body.project_id)

    # Convert history to dict format
    history = [{"role": m.role, "content": m.content} for m in body.history]

    return StreamingResponse(
        agent_svc.stream_chat(project_id, body.message, history, db),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
