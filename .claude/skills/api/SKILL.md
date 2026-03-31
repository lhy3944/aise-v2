---
name: api
description: 지정한 리소스의 라우터, 스키마, 서비스 파일을 스캐폴딩 생성
argument-hint: "resource-name"
---

# API 리소스 스캐폴딩

"$ARGUMENTS" 리소스에 대해 다음 파일들을 생성하세요:

## 생성할 파일
1. **`backend/src/schemas/api/$ARGUMENTS.py`** — Pydantic API 요청/응답 스키마
   - `docs/requirements/`의 요구사항을 참고하여 Create/Update/Response 스키마 정의
2. **`backend/src/routers/$ARGUMENTS.py`** — FastAPI 라우터
   - CRUD 엔드포인트 (GET, POST, PUT, DELETE)
   - 기존 `routers/sample.py` 패턴을 참고
3. **`backend/src/services/${ARGUMENTS}_svc.py`** — 비즈니스 로직 서비스
   - CRUD 함수 구현
4. **(필요 시) `backend/src/schemas/llm/$ARGUMENTS.py`** — LLM Structured Output 스키마
   - AI 생성 결과물의 출력 구조 정의 (해당 리소스가 LLM 생성 기능을 포함하는 경우)

## 규칙
- 기존 코드 패턴(로깅, 예외처리, 라우터 등록 방식)을 따를 것
- `main.py`에 새 라우터를 등록할 것
- 생성 후 PLAN.md와 PROGRESS.md를 업데이트할 것

리소스 이름: $ARGUMENTS
