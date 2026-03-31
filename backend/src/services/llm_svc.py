import os

from loguru import logger
from openai import AsyncAzureOpenAI


# Azure OpenAI 클라이언트 (SRS용)
_srs_client: AsyncAzureOpenAI | None = None
# Azure OpenAI 클라이언트 (TC용)
_tc_client: AsyncAzureOpenAI | None = None

DEFAULT_MODEL = "gpt-5.2"


def get_srs_client() -> AsyncAzureOpenAI:
    global _srs_client
    if _srs_client is None:
        _srs_client = AsyncAzureOpenAI(
            api_key=os.environ["SRS_API_KEY"],
            azure_endpoint=os.environ["SRS_ENDPOINT"],
            api_version="2025-03-01-preview",
        )
    return _srs_client


def get_tc_client() -> AsyncAzureOpenAI:
    global _tc_client
    if _tc_client is None:
        _tc_client = AsyncAzureOpenAI(
            api_key=os.environ["TC_API_KEY"],
            azure_endpoint=os.environ["TC_ENDPOINT"],
            api_version="2025-03-01-preview",
        )
    return _tc_client


async def chat_completion(
    messages: list[dict],
    *,
    model: str = DEFAULT_MODEL,
    client_type: str = "srs",
    temperature: float = 0.3,
    max_completion_tokens: int = 4096,
) -> str:
    """Azure OpenAI Chat Completion 호출 (범용)"""
    client = get_srs_client() if client_type == "srs" else get_tc_client()

    logger.debug(f"LLM 호출: model={model}, messages={len(messages)}개, client={client_type}")

    response = await client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_completion_tokens=max_completion_tokens,
    )

    content = response.choices[0].message.content or ""
    logger.debug(f"LLM 응답: {len(content)}자")
    return content
