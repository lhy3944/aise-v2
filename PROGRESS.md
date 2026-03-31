# AISE 2.0 - 진행 상황 (PROGRESS)

> 각 에이전트는 작업 시작/완료 시 이 파일을 업데이트할 것.
> 작업 계획은 PLAN.md 참조.

## 현재 상태

| 영역 | 상태 | 비고 |
|------|------|------|
| Backend 보일러플레이트 | Done | FastAPI + Loguru + CORS + 미들웨어 + 예외처리 |
| Frontend | Done | Next.js 16 + 프로젝트/요구사항/Glossary/Assist 페이지 구현 |
| DB | Done | PostgreSQL 16 + SQLAlchemy + asyncpg + Alembic |
| 프로젝트 CRUD | Done | Project CRUD + Settings API 구현 완료 |
| 요구사항 CRUD | Done | Requirement CRUD + 일괄 선택/해제 + 버전 저장 + 넘버링(FR-001) + 순서 변경 + 테이블 뷰 |
| Glossary CRUD | Done | Glossary CRUD + LLM 자동 생성 API 구현 완료 |
| AI 어시스트 | Done | refine + suggest + chat(자연스러운 대화체 + 요청 시 추출 + 체크박스 반영) |
| 테스트 인프라 | Done | pytest 56개 (Project/Settings/Requirement/Glossary/Assist/Review) |
| 요구사항 Review | Done | Review API + 프롬프트 + 테스트 6개 구현 완료 |
| 요구사항 섹션(그룹핑) | Done | Section CRUD API + 프론트 UI (접기/펼치기, 드래그, 섹션 간 이동) |
| SRS 생성 | Not Started | Phase 2 다음 작업 |

## 작업 로그

### 2026-03-30 (요구사항 섹션/그룹핑 기능 — FR-RQ-01-23~30)
- **요구사항 문서 업데이트**: FR-RQ-01-23~30 추가 (섹션 CRUD, 드래그, 접기/펼치기, SRS 반영, Import 연동)
- **DB 모델**: `RequirementSection` 테이블 생성 (project_id, type, name, order_index) + `Requirement.section_id` FK 추가 (SET NULL)
- **마이그레이션**: `cef0a99d1daf_add_requirement_sections`
- **백엔드 API**:
  - `section_svc.py` — 섹션 CRUD + 순서 변경
  - `requirement_svc.py` — section_id 지원 (응답, 생성, 수정, 스냅샷)
  - `/api/v1/projects/{id}/requirement-sections` — GET/POST/PUT/DELETE + reorder
- **프론트엔드**:
  - `Section` 타입 + `section-service.ts` API 클라이언트
  - `RequirementTable.tsx` 개편 — 섹션 헤더(접기/펼치기), 섹션 내/간 드래그, 미분류 영역, 인라인 섹션 CRUD
  - `page.tsx` — 섹션 데이터 fetch, CRUD 핸들러, 섹션 이동 핸들러 통합
- **테스트**: 56 passed (기존 테스트 전체 통과)

### 2026-03-29 (대화 모드 개선 — 자연스러운 대화 + 체크박스 추출)
- **대화 모드 프롬프트 전면 재작성 (FR-RQ-01-04~06)**
  - 자연스러운 대화체 톤 (정형화된 질문 나열 → 자연스러운 대화)
  - 추출 타이밍: 매 응답 자동 → 사용자 명시적 요청 시에만 ('정리해줘', '요구사항 뽑아줘' 등)
  - 명확한 입력은 즉시 정제 제안, 모호한 입력은 대화로 구체화
  - 기존 요구사항을 배경 컨텍스트로만 활용 (display_id 포함, 명시적 나열 X)
  - 대화 내 refine 지원 ('다듬어줘' → 정제 결과 자연스럽게 제안)
- **체크박스 목록 UI (ExtractedRequirementList.tsx)**
  - 추출된 요구사항을 타입별(FR/QA/Constraints) 그룹화하여 체크박스 목록으로 표시
  - 기본 미선택 상태, 사용자가 확인 후 원하는 것만 체크
  - '반영' 버튼 → 확인 다이얼로그 → 하단 테이블에 추가
- **대화 모드 하단 요구사항 테이블 현황 표시** (FR/QA/CON 탭, RequirementTable 재사용)
- **요구사항 Description truncate 제거** — 텍스트 전체 표시 (whitespace-pre-wrap)
- 요구사항 문서 FR-RQ-01-04~06 업데이트 + FR-RQ-01-05-01~03 신규 추가
- 테스트 56개 전체 통과 + Next.js 빌드 통과

### 2026-03-29 (요구사항 넘버링 + 테이블 뷰)
- **요구사항 자동 넘버링 구현 (FR-RQ-01-20)**
  - DB: `display_id` (String, 예: FR-001, QA-001, CON-001) + `order_index` (Integer) 필드 추가
  - Alembic 마이그레이션 생성 및 적용
  - 생성 시 타입별 자동 넘버링 (FR-001, FR-002, ...), 삭제 시 번호 재사용 안 함
- **요구사항 순서 변경 API 구현 (FR-RQ-01-21)**
  - `PUT /api/v1/projects/{id}/requirements/reorder` — 드래그 앤 드롭 순서 변경
  - `RequirementReorderRequest` 스키마 (ordered_ids 배열)
  - 목록 조회 시 `order_index` 기준 정렬, 버전 저장에 display_id/order_index 포함
- **AUTOSAD 스타일 테이블 뷰 (FR-RQ-01-22)**
  - `RequirementTable.tsx`: 테이블 형태 (No./Description/Include/Actions)
  - 드래그 앤 드롭으로 행 순서 변경 (HTML5 Drag API)
  - 인라인 편집 (Edit 버튼 → Textarea → Cmd+Enter/저장)
  - 기존 카드형 `RequirementItem` → 테이블 뷰로 교체
- 요구사항 문서 FR-RQ-01-20~22, interface.md, PLAN.md 업데이트
- 테스트 54개 전체 통과 + Next.js 빌드 통과

### 2026-03-29 (Phase 1.5 대화 모드 Chat Frontend UI 구현)
- **대화 모드(Chat) 프론트엔드 UI 구현 (FR-RQ-01-04~07)**
  - `types/project.ts`: ChatMessage, ExtractedRequirement, ChatRequest, ChatResponse 타입 추가
  - `services/assist-service.ts`: `chat()` 메서드 추가
  - `components/projects/ChatPanel.tsx`: 대화 채팅 패널 (메시지 목록, 입력, 전송, 로딩, 추출된 요구사항 표시)
  - `components/projects/ExtractedRequirementCard.tsx`: 추출된 요구사항 카드 (타입 뱃지, 수정 가능 textarea, 수락/거절)
  - `app/(main)/projects/[id]/requirements/page.tsx`: 구조화 모드 / 대화 모드 전환 토글 추가
  - other 타입 수락 시 fr로 fallback 처리
  - 수락된 요구사항은 requirementService.create를 통해 DB 저장 + 요구사항 목록에 반영
  - Next.js 빌드 통과 확인

### 2026-03-29 (Phase 2.1 요구사항 Review API 구현)
- **요구사항 Review API 구현 (FR-RQ-02)**
  - `POST /api/v1/projects/{id}/review/requirements` -- 요구사항 충돌/중복/모호성 검출
  - `schemas/api/review.py`: ReviewRequest, ReviewIssue, ReviewSuggestion, ReviewSummary, ReviewResponse 스키마 (Literal 타입 적용)
  - `prompts/review/requirements.py`: Review 프롬프트 (충돌/중복/모호성 검출 + 수정 제안, 입력 언어 동일 응답)
  - `services/review_svc.py`: `review_requirements()` -- UUID 변환 + DB 조회 + 프롬프트 구성 + LLM 호출 + JSON 파싱
  - `routers/review.py`: POST `/requirements` 엔드포인트
  - `main.py`에 review_router 등록
  - 테스트 6개 추가 (정상 리뷰, 존재하지 않는 ID 404, LLM 에러 500, 비정상 JSON 502, 이슈 없음 + ready_for_next=true, 무효 UUID 400)

### 2026-03-29 (Phase 1.5 대화 모드 + 모듈 확장 + CORS 수정)
- **AI 어시스트 대화 모드(Chat) API 구현**
  - `POST /api/v1/projects/{id}/assist/chat` — 자유 대화를 통한 요구사항 탐색적 정의
  - `prompts/assist/chat.py`: 대화 모드 프롬프트 (대화 + 기존 요구사항 컨텍스트 → 요구사항 추출)
  - `services/assist_svc.py`: `chat_assist()` — 기존 요구사항 DB 조회 + LLM 대화 + 요구사항 추출
  - `schemas/api/assist.py`: ChatMessage, ChatRequest, ChatResponse, ExtractedRequirement 스키마
  - `routers/assist.py`: `/chat` 엔드포인트 추가
  - role Literal["user","assistant"] 검증으로 프롬프트 인젝션 차단
  - 테스트 6개 추가 (chat, chat_with_history, chat_no_extraction, chat_llm_error, chat_invalid_json, chat_invalid_role)
- **프로젝트 모듈 선택 5가지로 확장 (FR-PF-02-03)**
  - 기존 3가지(All/Req+Design/TC) → 5가지(All/Req Only/Req+Design/Req+TC/TC Only)
  - `schemas/api/project.py`: 유효 모듈 조합 검증 (`VALID_MODULE_SETS` + `model_validator`)
  - SRS 요구사항, interface.md, CLAUDE.md, UC-02 문서 업데이트
  - 테스트 7개 추가 (유효 5조합 + 무효 2조합)
- **CORS 버그 수정**
  - `allow_origin_regex` 추가: 내부 IP(10.x, 172.x)에서 접속 시 OPTIONS 400 해결
  - `max_age` -1 → 600으로 변경 (프리플라이트 캐싱 활성화)
- 전체 42개 테스트 통과

### 2026-03-29 (요구사항 리뷰 반영)
- **요구사항 문서 대폭 리뷰 및 업데이트**
  - FR-RQ-06 Classification: Other 분류 추가, 2-pass 청킹 전략, 신뢰도/중복탐지 요구사항 추가
  - FR-RQ-07 (신규): SRS 문서 생성 — 템플릿 기반 조합 기능
  - FR-RQ-08 (신규): SRS Review — AI Review (완전성/일관성/명확성)
  - FR-RQ-09 (구 07): 버전관리, FR-RQ-10 (구 08): 추적성 — 번호 시프트
  - FR-RQ-01: 구조화 모드 + 대화 모드 2가지 입력 방식 추가 (01-04~07 신규)
  - FR-PF-03: 멤버 권한 Owner/Editor/Viewer로 정리 (Reviewer는 향후 확장)
  - FR-PF-05: 문서 파싱/미리보기 요구사항 추가
  - interface.md: parse/classify(SSE)/srs-review API 추가, Other 타입 반영
- **Use Case 문서 신규 작성**
  - UC-01: PRD Import → Classification → SRS 생성 플로우
  - UC-02: 자연어 직접 입력 → SRS 생성 플로우
- **PLAN.md 업데이트**: 대화 모드(1.5), SRS Review(2.3), Classification 2-pass(2.4) 등 반영
- **백엔드 코드 수정**: RequirementType에 OTHER 추가, MemberRole에서 REVIEWER 제거, 프롬프트/스키마 other 반영

### 2026-03-28 (리팩토링)
- **W-01: glossary 프롬프트를 prompts/ 디렉토리로 분리**
  - `src/prompts/glossary/__init__.py`: `build_glossary_generate_prompt` export
  - `src/prompts/glossary/generate.py`: 프롬프트 빌더 함수 (기존 glossary_svc.py에서 이동)
  - `src/services/glossary_svc.py`: 하드코딩된 프롬프트 제거, `build_glossary_generate_prompt` import 사용
- **W-02: model-to-response 변환 위치를 서비스 레이어로 통일**
  - `src/services/project_svc.py`: `_to_project_response()`, `_to_settings_response()` 추가, 모든 서비스 함수가 응답 스키마 직접 반환
  - `src/routers/project.py`: 변환 함수 제거, 라우터를 얇게 유지 (서비스 결과를 그대로 반환)
  - 기존 패턴과 일관성 확보: requirement_svc, glossary_svc와 동일하게 서비스 레이어에서 변환
- 전체 29개 테스트 통과 확인

### 2026-03-28
- **pytest conftest.py + Project/Settings 테스트 작성**
  - `tests/conftest.py`: 테스트 공통 fixture (NullPool + per-request 세션 + DELETE 기반 데이터 정리)
  - `tests/test_project.py`: Project CRUD 8개 테스트 (create, list, get, get_not_found, update, delete, get_settings, update_settings)
  - `pyproject.toml`에 `[tool.pytest.ini_options]` 추가 (asyncio_mode=auto, pythonpath)
  - 기존 테스트(assist, glossary, requirement) 포함 전체 29개 테스트 통과
- **AI Assist ��스트 코드 작성 (LLM mock)**
  - `tests/test_assist.py`: 7개 테스트 케이스 (refine 3개, suggest 4개)
    - `test_refine`: 정상 정제 요청 검증
    - `test_refine_llm_error`: LLM 호출 예외 시 500 응답 검증
    - `test_refine_invalid_json`: LLM 비정상 JSON 반환 시 502 응답 검증
    - `test_suggest`: 정상 제안 요청 검증
    - `test_suggest_no_requirements`: 존재하지 않는 requirement_id 시 404 검증
    - `test_suggest_llm_error`: suggest 시 LLM 예외 500 검증
    - `test_suggest_invalid_json`: suggest 시 비정상 JSON 502 검증
  - `src/services/assist_svc.chat_completion`을 monkeypatch(patch)로 mock 처리
  - `tests/conftest.py` 개선: NullPool + 요청별 세션 생성으로 에러 격리
  - `src/middleware/logging_middleware.py` 개선: BaseHTTPMiddleware에서 예외 발생 시 직접 500/AppException 응답 반환 (기존에는 re-raise하여 ASGI 레벨까지 전파되는 버그 수정)
- **Phase 1 MVP 전체 구현 완료**
- DB 인프라 구축
  - `core/database.py`: AsyncSession + async_sessionmaker + get_db dependency
  - Alembic 설정 및 초기 마이그레이션 (projects, project_settings, requirements, requirement_versions, glossary_items)
  - `services/llm_svc.py`: Azure OpenAI 비동기 클라이언트 (SRS/TC 이중 클라이언트)
  - DB 모델: Project, ProjectSettings, Requirement, RequirementVersion, GlossaryItem
- Frontend MVP 페이지 구현 (로컬 확인용, commit 대상 아님)
  - 프로젝트 목록/생성/수정/삭제 페이지
  - 요구사항 관리 (FR/QA/Constraints 탭, CRUD, 일괄 선택, 버전 저장)
  - AI 어시스트 (정제 비교 UI, 제안 수락/거절)
  - Glossary 관리 (CRUD, 자동 생성)
- AI Assist API 구현 완료 (refine + suggest)
  - `prompts/assist/refine.py`: 자연어 -> 요구사항 정제 프롬프트 (IEEE 29148 기반, FR/QA/Constraints별 가이드)
  - `prompts/assist/suggest.py`: 기존 요구사항 기반 누락 요구사항 보완 제안 프롬프트
  - `prompts/assist/__init__.py`, `prompts/__init__.py`: 패키지 초기화
  - `services/assist_svc.py`: refine_requirement + suggest_requirements 비즈니스 로직 (LLM 호출 + JSON 파싱)
  - `routers/assist.py`: POST /assist/refine, POST /assist/suggest 엔드포인트
  - `main.py`에 assist_router 등록
  - suggest는 requirement_ids로 DB 조회 후 정제된 텍스트 우선 사용하여 LLM에 전달
- Glossary CRUD API 구현 완료
  - `services/glossary_svc.py`: 용어 CRUD + LLM 기반 자동 생성 비즈니스 로직
  - `routers/glossary.py`: 5개 엔드포인트 (목록/추가/수정/삭제 + 자동 생성)
  - generate 엔드포인트: 프로젝트 요구사항에서 도메인 용어 추출 (DB 저장 없이 초안 반환)
  - `main.py`에 glossary_router 등록
- Requirement CRUD API 구현 완료
  - `services/requirement_svc.py`: 요구사항 CRUD + 일괄 선택/해제 + 버전 저장 비즈니스 로직
  - `routers/requirement.py`: 6개 엔드포인트 (목록/생성/수정/삭제 + 일괄선택 + 버전저장)
  - `main.py`에 requirement_router 등록
  - 기존 스키마(`schemas/api/requirement.py`) 및 모델(`models/requirement.py`) 활용
- Project CRUD API 구현 완료
  - `services/project_svc.py`: 프로젝트 및 설정 CRUD 비즈니스 로직 (async 함수, AsyncSession 주입)
  - `routers/project.py`: 7개 엔드포인트 (목록/생성/조회/수정/삭제 + 설정 조회/수정)
  - `main.py`에 project_router 등록
  - `models/project.py`: ProjectSettings.project_id에 ForeignKey 누락 수정
  - 모듈 선택은 ProjectCreate.modules 필드로 처리 (ProjectModule enum)
  - member_count는 MVP에서 0 고정 (Phase 6에서 구현)
- PLAN.md Phase 1.2 항목 4개 완료 체크

### 2026-03-27
- LangChain Deep Agents 조사 완료 (`references/2026-03-27_langchain-deepagent.md`)
  - Deep Agents 개요: LangChain/LangGraph 기반 에이전트 하네스 (계획, 파일시스템, 서브에이전트)
  - 아키텍처: 미들웨어 스택, 플러그 가능 백엔드, 컨텍스트 자동 관리
  - v0.4부터 OpenAI Responses API 기본 지원, 샌드박스 통합
  - Azure OpenAI 사용 가능 (init_chat_model 또는 AzureChatOpenAI)
  - AISE 2.0 적용 가능성: SRS 생성에 Deep Agents 활용 권장 (옵션 B: 선택적 채택)
- Azure OpenAI Responses API 조사 완료 (`references/2026-03-27_azure-openai-responses-api.md`)
  - Responses API vs Chat Completions API 차이점 정리
  - 멀티턴 대화 처리 방식 (previous_response_id, Conversations API, 수동 관리)
  - 파일 입력 지원 (PDF, 이미지, Base64/URL/File ID)
  - Python SDK 사용법 (Azure OpenAI 포함)
  - Azure OpenAI 지원 모델/리전 현황
  - GPT-5.2 모델 정보 (400K 컨텍스트, $1.75/1M 입력 토큰)
  - AISE 2.0 프로젝트 적용 시사점 도출

### 2026-03-25
- CLAUDE.md 작성 (MVP 범위, 데이터 모델, 디렉토리 구조 정의)
- PLAN.md / PROGRESS.md 생성
- Backend 보일러플레이트 확인 완료 (Python 3.14, FastAPI)
