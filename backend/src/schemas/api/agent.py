"""Agent Chat API 스키마"""

from pydantic import BaseModel


class AgentChatMessage(BaseModel):
    role: str  # "user" | "assistant" | "tool"
    content: str
    tool_name: str | None = None  # for tool messages
    tool_data: dict | None = None  # structured data (e.g., clarify questions, requirements)


class AgentChatRequest(BaseModel):
    session_id: str
    message: str
    attachments: list[dict] = []  # [{filename, content_type, ...}]
