"""임베딩 서비스 -- Azure OpenAI text-embedding-3-large"""

from loguru import logger

from src.core.exceptions import AppException
from src.services.llm_svc import get_srs_client

BATCH_SIZE = 100


async def get_embeddings(
    texts: list[str],
    model: str = "text-embedding-3-large",
) -> list[list[float]]:
    """텍스트 리스트에 대한 임베딩 벡터를 반환한다.

    100개 단위로 배치 처리하여 API를 호출한다.
    """
    if not texts:
        return []

    client = get_srs_client()
    all_embeddings: list[list[float]] = []

    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i : i + BATCH_SIZE]
        logger.debug(f"임베딩 요청: batch {i // BATCH_SIZE + 1}, size={len(batch)}")

        try:
            response = await client.embeddings.create(
                model=model,
                input=batch,
            )
            batch_embeddings = [item.embedding for item in response.data]
            all_embeddings.extend(batch_embeddings)
        except Exception as e:
            logger.error(f"임베딩 API 호출 실패: {e}")
            raise AppException(500, f"임베딩 생성 실패: {e}")

    logger.info(f"임베딩 완료: {len(all_embeddings)}개 벡터 생성")
    return all_embeddings
