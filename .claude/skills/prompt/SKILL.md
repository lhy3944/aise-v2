---
name: prompt
description: LLM 프롬프트 작성/개선. AI 어시스트, Review, TC/SRS 생성용 프롬프트를 일관된 패턴으로 관리
argument-hint: "create|improve 프롬프트명"
---

# LLM 프롬프트 작성/개선

"$ARGUMENTS"에 대해 다음을 수행하세요:

## "create 프롬프트명"인 경우
- `backend/src/prompts/` 하위에 프롬프트 파일 생성
- 아래 구조를 따를 것:
  - **역할 정의**: LLM이 수행할 역할 명시
  - **입력 명세**: 어떤 데이터가 들어오는지 (요구사항, 컨텍스트 등)
  - **출력 명세**: 기대하는 출력 형식 (schemas/llm/ 스키마 참조)
  - **제약 조건**: 반드시 지켜야 할 규칙
  - **예시**: Few-shot 예시 (가능하면 포함)
- 관련 요구사항 ID를 주석으로 명시 (예: # FR-RQ-01-02)
- 관련 LLM 출력 스키마(`schemas/llm/`)가 없으면 함께 생성할 것

## "improve 프롬프트명"인 경우
- 기존 프롬프트 파일을 읽고 분석
- 개선점 제안:
  - 모호한 지시사항
  - 누락된 제약 조건
  - 출력 품질을 높일 수 있는 기법 (Chain of Thought, Few-shot 등)
- 사용자 확인 후 수정 적용

## 프롬프트 디렉토리 구조
```
backend/src/prompts/
├── assist/          # 요구사항 정제/보완/제안
├── review/          # Review (요구사항, UCD, UCS, TC)
├── srs/             # SRS 생성
├── design/          # Design 산출물 생성 (UCD, UCS 등)
└── testcase/        # TC 생성
```

인자: $ARGUMENTS
