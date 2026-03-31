# AISE 2.0 - 작업 계획 (PLAN)

> 요구사항 문서: `docs/requirements/` (FR-PF, FR-RQ, FR-TC)
> API 인터페이스: `docs/interface.md`
> 진행 상황: `PROGRESS.md`

---

## Phase 1: MVP — 프로젝트 + 요구사항 + AI 어시스트

> 핵심 가치: "요구사항을 입력하면 AI가 정제/보완해주는" 기본 루프 완성

### 1.1 인프라 / 기반
- [x] PostgreSQL DB 연결 설정 (SQLAlchemy + asyncpg)
- [x] DB 마이그레이션 설정 (Alembic)
- [x] Azure OpenAI 연동 서비스 (`services/llm_svc.py`) — Responses API 기반
- [x] Frontend API 클라이언트 설정 (Backend 연동)
- [ ] ~~SSO(Keycloak) 연동~~ → Phase 6으로 이동

### 1.2 프로젝트 관리 (FR-PF-02)
- [x] DB 모델: Project
- [x] API: Project CRUD (`/api/v1/projects`)
- [x] API: 프로젝트 설정 (`/api/v1/projects/{id}/settings`)
- [x] API: 모듈 선택 (All / Requirements+Design / Test Case)
- [x] Frontend: 프로젝트 목록 페이지
- [x] Frontend: 프로젝트 생성/수정/삭제

### 1.3 요구사항 관리 (FR-RQ-01)
- [x] DB 모델: Requirement (type: FR/QA/Constraints/Other)
- [x] API: Requirement CRUD (`/api/v1/projects/{id}/requirements`)
- [x] API: 요구사항 일괄 선택/해제
- [x] API: 요구사항 저장 (버전 생성)
- [x] Frontend: 요구사항 입력/목록 페이지 (FR/QA/Constraints/Other 탭)
- [x] Frontend: 요구사항 선택/수정/삭제 UI
- [x] DB: `display_id` (자동 넘버링, 예: FR-001) + `order_index` (드래그 순서) 필드 추가 (FR-RQ-01-20~21)
- [x] API: 요구사항 생성 시 `display_id` 자동 부여 (타입별 max seq + 1)
- [x] API: 요구사항 순서 변경 (`PUT /requirements/reorder`) (FR-RQ-01-21)
- [x] Frontend: 요구사항 테이블 뷰 (넘버링/내용/포함여부/액션) (FR-RQ-01-22)
- [x] Frontend: 드래그 앤 드롭 순서 변경

### 1.4 AI 어시스트 — 구조화 모드 (FR-RQ-01-01~03)
- [x] API: 자연어 → 요구사항 정제 (`/api/v1/projects/{id}/assist/refine`)
- [x] API: 보완/제안 (`/api/v1/projects/{id}/assist/suggest`)
- [x] 프롬프트: 정제(refine) 프롬프트 작성
- [x] 프롬프트: 보완/제안 프롬프트 작성
- [x] Frontend: 원본 vs LLM 제안 비교 UI
- [x] Frontend: 제안 수락/거절 인터랙션

### 1.5 AI 어시스트 — 대화 모드 (FR-RQ-01-04~07)
- [x] API: 대화형 요구사항 정의 Chat (`/api/v1/projects/{id}/assist/chat`)
- [x] API: 대화에서 FR/QA/Constraints/Other 자동 추출 + 추가 제안
- [x] 프롬프트: 대화 모드 프롬프트 (대화 → 요구사항 추출)
- [x] Frontend: 대화 모드 Chat 인터페이스
- [x] Frontend: 추출된 요구사항 수락/거절/수정 UI
- [x] Frontend: 구조화 모드 ↔ 대화 모드 전환 UI
- [x] Frontend: 대화 모드 하단에 요구사항 테이블 현황 표시 (FR/QA/CON 탭)

#### 1.5.1 대화 모드 개선 (FR-RQ-01-04~06 재설계)
- [x] 프롬프트: 자연스러운 대화체 톤으로 변경 (정형화된 질문 나열 → 자연스러운 대화)
- [x] 프롬프트: 기존 요구사항을 배경 컨텍스트로만 활용 (중복 방지, 명시적 나열 X)
- [x] 프롬프트: 추출 타이밍 변경 — 매 응답 자동 추출 → 사용자 요청 시에만 ('정리해줘' 등)
- [x] 프롬프트: 명확한 입력은 즉시 정제 제안 + 모호한 입력은 대화로 구체화
- [x] 프롬프트: 대화 내 refine 지원 ('이거 다듬어줘' → 정제 결과 제안)
- [x] API: 추출 결과를 타입별(FR/QA/CON) 그룹화하여 반환 (프론트에서 그룹화)
- [x] Frontend: 추출 결과를 타입별 체크박스 목록으로 표시 (ExtractedRequirementList)
- [x] Frontend: 체크한 항목 확인 다이얼로그 → 테이블에 반영

### 1.6 Glossary (FR-RQ-01-17~19)
- [x] DB 모델: Glossary
- [x] API: Glossary CRUD (`/api/v1/projects/{id}/glossary`)
- [x] API: Glossary 자동 생성
- [x] Frontend: 용어 관리 페이지

---

## Phase 2: Review + 섹션 그룹핑 + SRS 생성 + Import/Classification

> 핵심 가치: "입력 품질 검증 → SRS 문서 생성" 파이프라인 완성

### 2.0 요구사항 섹션(그룹핑) 기능 (FR-RQ-01-23~30) ★ 최우선
- [x] DB 모델: RequirementSection (project_id, type, name, order_index)
- [x] API: 섹션 CRUD (`/api/v1/projects/{id}/requirement-sections`)
- [x] API: 섹션 순서 변경 (`PUT /requirement-sections/reorder`)
- [x] API: 요구사항에 section_id 필드 추가 + 섹션 간 이동
- [x] API: 요구사항 조회 시 섹션별 그룹핑 응답
- [x] Frontend: 섹션 추가/이름변경/삭제 UI
- [x] Frontend: 섹션별 접기/펼치기 (collapse/expand)
- [x] Frontend: 요구사항 드래그 앤 드롭으로 섹션 간 이동
- [x] Frontend: 섹션 헤더 드래그로 섹션 순서 변경
- [ ] SRS 생성 시 섹션 구조 → 문서 챕터 반영 (2.2와 연동)
- [ ] Import/Classification 시 섹션 자동 추출 (2.4와 연동)

### 2.1 요구사항 Review (FR-RQ-02)
- [x] API: 요구사항 Review (`/api/v1/projects/{id}/review/requirements`)
- [ ] API: Review 수정 제안 수락/거절 흐름
- [x] 프롬프트: Review 프롬프트 작성 (충돌/중복/모호성 검출 + 수정 제안)
- [ ] Frontend: Review 결과 표시 + 수정 제안 수락/거절 UI

### 2.2 SRS 생성 (FR-RQ-07)
- [ ] API: SRS 생성 (`/api/v1/projects/{id}/srs/generate`)
- [ ] API: SRS 조회
- [ ] Deep Agents: SRS 생성 에이전트 (`agents/srs_agent.py`)
- [ ] 프롬프트: SRS 생성 프롬프트 (IEEE 830 템플릿 기반)
- [ ] Frontend: SRS 생성 요청 + 미리보기 페이지 + 진행률 표시

### 2.3 SRS Review (FR-RQ-08)
- [ ] API: SRS Review (`/api/v1/projects/{id}/srs/{id}/review`)
- [ ] API: SRS Review 수정 제안 수락/거절 (`/api/v1/.../review/{id}/apply`)
- [ ] API: SRS 재생성 (`/api/v1/projects/{id}/srs/{id}/regenerate`)
- [ ] 프롬프트: SRS Review 프롬프트 (완전성/일관성/명확성 검토)
- [ ] Frontend: SRS Review 결과 + 섹션별 수정 제안 UI

### 2.4 Import / Classification (FR-PF-05, FR-RQ-06)
- [ ] API: 파일 업로드 (`/api/v1/projects/{id}/import/file`)
- [ ] API: 문서 파싱 + 미리보기 (`/api/v1/projects/{id}/import/{id}/parse`)
- [ ] API: Jira Import (`/api/v1/projects/{id}/import/jira`)
- [ ] API: Classification 요청 — 2-pass 방식 (`/api/v1/projects/{id}/classify`)
- [ ] 프롬프트: 1차 pass 프롬프트 (문서 구조/섹션 파악)
- [ ] 프롬프트: 2차 pass 프롬프트 (섹션별 FR/QA/Constraints/Other 추출)
- [ ] Classification 후처리: 중복 탐지 + 신뢰도 산출
- [ ] Frontend: 문서 업로드 + 파싱 미리보기 UI
- [ ] Frontend: 분류 결과 확인/수정/재분류 UI + 진행률 표시
- [ ] Frontend: Classification → 요구사항 목록 자동 반영 UI

### 2.5 Export (FR-PF-05)
- [ ] API: Export (`/api/v1/projects/{id}/export`) — PDF, Markdown, Word
- [ ] API: Jira/Polarion 업로드
- [ ] `utils/` 변환기: Markdown → PDF, Markdown → Word
- [ ] Frontend: Export 버튼 + 형식 선택 UI

---

## Phase 3: TestCase 생성

> 핵심 가치: "요구사항 기반 TC 자동 생성" — 독립모드 + 연동모드

### 3.1 연동 모드 TC (FR-TC-03)
- [ ] API: TC 생성 (`/api/v1/projects/{id}/testcases/generate`)
- [ ] API: TC CRUD
- [ ] API: TC 일괄 선택/해제
- [ ] API: TC 저장 (버전 생성)
- [ ] Deep Agents: TC 생성 에이전트 (`agents/tc_agent.py`)
- [ ] 프롬프트: TC 생성 프롬프트 (동치 분할, 경계값 분석 등)
- [ ] Frontend: TC 생성 요청 + 기법 선택 UI
- [ ] Frontend: TC 목록/수정/삭제 + 요구사항 매핑 표시 (FR-TC-01-09)

### 3.2 독립 모드 TC (FR-TC-02)
- [ ] API: 독립모드 분류 (`/api/v1/testcases/classify`)
- [ ] API: 독립모드 TC 생성 (`/api/v1/testcases/generate-standalone`)
- [ ] Frontend: 독립모드 문서 업로드/자연어 입력
- [ ] Frontend: 분류 결과 확인 후 TC 생성

### 3.3 TC Chat (FR-TC-01-07)
- [ ] API: TC Chat (`/api/v1/projects/{id}/testcases/chat`)
- [ ] Frontend: Chat으로 TC 수정 인터페이스

### 3.4 TC Review (FR-TC-04)
- [ ] API: TC Review (`/api/v1/projects/{id}/review/testcases`)
- [ ] 프롬프트: TC Review 프롬프트 (커버리지 80% 검증)
- [ ] Frontend: TC Review 결과 + 커버리지 표시

### 3.5 TC Export (FR-TC-05)
- [ ] API: TC Export (`/api/v1/projects/{id}/testcases/export`) — Jira, Polarion, Excel, Markdown
- [ ] Frontend: TC Export UI

---

## Phase 4: Design (Use Case Diagram / Specification)

> 핵심 가치: "요구사항 → 설계 산출물 자동 생성" + SAD 문서

### 4.1 Use Case Diagram (FR-RQ-03)
- [ ] API: UCD 생성 (`/api/v1/projects/{id}/usecase-diagrams/generate`)
- [ ] API: UCD 코드 직접 수정
- [ ] API: UCD Chat 수정
- [ ] API: UCD 저장 (버전)
- [ ] Deep Agents: Design 에이전트 (`agents/design_agent.py`)
- [ ] 프롬프트: UCD 생성 프롬프트 (PlantUML/Mermaid)
- [ ] Frontend: 코드 에디터 + 다이어그램 미리보기 (split view)

### 4.2 Use Case Specification (FR-RQ-04)
- [ ] API: UCS 생성 (UCD 기반)
- [ ] API: UCS 후보 선택/수정/삭제
- [ ] Frontend: Specification 목록 + 후보 선택 UI

### 4.3 Interaction Diagram (FR-RQ-04-04)
- [ ] API: Interaction Diagram 생성 (UCS 기반)
- [ ] Frontend: Interaction Diagram 코드/미리보기

### 4.4 System Models — Logical / Dynamic / Physical (FR-RQ-04-07)
- [ ] API: System Context, Logical, Dynamic, Physical Design 생성
- [ ] Frontend: 각 모델 페이지

### 4.5 UCD/UCS Review (FR-RQ-02-05~06)
- [ ] API: UCD Review, UCS Review
- [ ] Frontend: Design Review 결과 UI

### 4.6 SAD 생성
- [ ] API: SAD 문서 생성 (Design 산출물 기반)
- [ ] Frontend: SAD 미리보기/Export

---

## Phase 5: 버전관리 + 추적성

> 핵심 가치: "산출물 간 연결 + 변경 시 영향 파악"

### 5.1 버전 관리 (FR-RQ-09, FR-TC-06)
- [ ] API: 버전 이력 조회 (`/api/v1/projects/{id}/versions`)
- [ ] API: 버전 비교 (diff)
- [ ] API: 이전 버전 복원
- [ ] Frontend: 버전 이력 타임라인 UI
- [ ] Frontend: 버전 비교(diff) 뷰

### 5.2 요구사항 추적성 (FR-RQ-10, FR-TC-07)
- [ ] 추적성 자동 기록 (generate/save 시 연결 생성)
- [ ] API: 추적성 매트릭스 조회
- [ ] 최신 기반 여부 표시 (`is_outdated` 플래그)
- [ ] API: outdated 산출물 재생성 트리거
- [ ] Frontend: Traceability Matrix 뷰
- [ ] Frontend: outdated 알림 + 재생성 버튼

### 5.3 Drift 버전 자동 유지 (FR-RQ-01-13, FR-RQ-03-07, FR-TC-01-08)
- [ ] 아키텍처 결정: auto-save 방식 (API polling / WebSocket / 로컬 스토리지)
- [ ] 구현: 저장하지 않아도 마지막 상태 유지

---

## Phase 6: 멤버 관리 + 알림 + 플랫폼 완성

> 핵심 가치: "팀 협업 기능 완성"

### 6.1 멤버 관리 (FR-PF-03)
- [ ] DB 모델: ProjectMember (역할: Owner/Editor/Viewer) ※ 향후 Reviewer 확장 가능
- [ ] API: 멤버 초대/역할변경/제거
- [ ] API: 역할별 권한 체크 미들웨어
- [ ] Frontend: 멤버 관리 페이지

### 6.2 알림 (FR-PF-07)
- [ ] DB 모델: Notification
- [ ] API: 알림 목록/읽음 처리
- [ ] 알림 트리거: Review 요청, 멤버 초대, 버전 변경
- [ ] Frontend: 알림 패널 UI

### 6.3 프로필 / 대시보드 (FR-PF-04, FR-PF-09)
- [ ] API: 프로필 수정 (`PUT /api/v1/users/me`)
- [ ] Frontend: 프로필 페이지
- [ ] Frontend: 대시보드 (최근 프로젝트, 미확인 알림)

### 6.4 SSO 연동 (FR-PF-01)
- [ ] Keycloak SSO 연동 — `GET /api/v1/users/me`
- [ ] LDAP 사용자 정보 기반 자동 로그인
- [ ] 세션 만료 시 리다이렉트

### 6.5 도움말 (FR-PF-08)
- [ ] Frontend: Help 페이지 (정적 콘텐츠)
- [ ] Frontend: 기능별 툴팁/인라인 가이드

---

## Phase 우선순위 요약

| Phase | 내용 | 핵심 가치 |
|-------|------|-----------|
| **1 (MVP)** | 프로젝트 + 요구사항 + AI 어시스트 + Glossary | 기본 루프 완성 |
| **2** | Review + SRS 생성 + Import/Classification/Export | SRS 파이프라인 완성 |
| **3** | TestCase 생성 (연동/독립/Chat/Review/Export) | TC 파이프라인 완성 |
| **4** | Design (UCD/UCS/Interaction/Models) + SAD | 설계 파이프라인 완성 |
| **5** | 버전관리 + 추적성 + Drift | 산출물 관리 완성 |
| **6** | 멤버 관리 + 알림 + 대시보드 + 도움말 | 팀 협업 완성 |
