"""텍스트 청킹 유틸리티 -- tiktoken 기반 재귀 문자 분할"""

import re

import tiktoken

_encoding = None


def _get_encoding():
    global _encoding
    if _encoding is None:
        _encoding = tiktoken.get_encoding("cl100k_base")
    return _encoding


def _token_count(text: str) -> int:
    return len(_get_encoding().encode(text))


def _split_by_separators(text: str, separators: list[str]) -> tuple[list[str], str]:
    """첫 번째로 매칭되는 구분자로 분할한다. 모두 실패하면 단어 단위로 분할.

    Returns:
        (분할된 파트 리스트, 사용된 구분자)
    """
    for sep in separators:
        parts = text.split(sep)
        if len(parts) > 1:
            # 빈 문자열만 필터링 (strip 하지 않아 들여쓰기 보존)
            result = [part for part in parts if part]
            return result, sep
    # fallback: 공백으로 분할
    return text.split(), " "


def chunk_text(
    text: str,
    max_tokens: int = 500,
    overlap_tokens: int = 50,
    file_type: str = "txt",
) -> list[str]:
    """텍스트를 max_tokens 이하의 청크로 분할한다.

    재귀 문자 분할 전략:
    1. 문단 (\\n\\n) 으로 분할
    2. 줄바꿈 (\\n) 으로 분할
    3. 문장 (. ! ?) 으로 분할 (md 제외)
    4. 단어 단위로 분할

    Args:
        text: 원본 텍스트
        max_tokens: 청크 최대 토큰 수
        overlap_tokens: 인접 청크 간 오버랩 토큰 수
        file_type: 문서 유형 (md일 때 문장 분할 생략)

    Returns:
        청크 문자열 리스트
    """
    if not text or not text.strip():
        return []

    text = text.strip()

    # 토큰 수가 max_tokens 이하면 그대로 반환
    if _token_count(text) <= max_tokens:
        return [text]

    # md: 문장 분할 생략 (마크다운 인라인 서식 보존)
    if file_type == "md":
        separators = ["\n\n", "\n"]
    else:
        separators = ["\n\n", "\n", ". ", "! ", "? "]
    segments, join_sep = _split_by_separators(text, separators)

    chunks: list[str] = []
    current_parts: list[str] = []
    current_tokens = 0

    for segment in segments:
        seg_tokens = _token_count(segment)

        # 세그먼트 하나가 max_tokens보다 크면 재귀 분할
        if seg_tokens > max_tokens:
            # 현재 버퍼가 있으면 먼저 flush
            if current_parts:
                chunks.append(join_sep.join(current_parts))
                current_parts = []
                current_tokens = 0
            # 단어 단위로 강제 분할
            words = segment.split()
            word_parts: list[str] = []
            word_tokens = 0
            for word in words:
                wt = _token_count(word)
                if word_tokens + wt > max_tokens and word_parts:
                    chunks.append(" ".join(word_parts))
                    # 오버랩: 마지막 몇 단어 유지
                    overlap_parts: list[str] = []
                    overlap_t = 0
                    for w in reversed(word_parts):
                        wt2 = _token_count(w)
                        if overlap_t + wt2 > overlap_tokens:
                            break
                        overlap_parts.insert(0, w)
                        overlap_t += wt2
                    word_parts = overlap_parts
                    word_tokens = overlap_t
                word_parts.append(word)
                word_tokens += wt
            if word_parts:
                # 남은 단어들을 하나의 세그먼트로 합쳐서 current에 넣음
                # (개별 단어가 join_sep으로 합쳐지는 것을 방지)
                current_parts = [" ".join(word_parts)]
                current_tokens = word_tokens
            continue

        if current_tokens + seg_tokens > max_tokens and current_parts:
            chunks.append(join_sep.join(current_parts))
            # 오버랩: 마지막 부분 유지
            overlap_parts = []
            overlap_t = 0
            for part in reversed(current_parts):
                pt = _token_count(part)
                if overlap_t + pt > overlap_tokens:
                    break
                overlap_parts.insert(0, part)
                overlap_t += pt
            current_parts = overlap_parts
            current_tokens = overlap_t

        current_parts.append(segment)
        current_tokens += seg_tokens

    if current_parts:
        chunks.append(join_sep.join(current_parts))

    return chunks
