---
name: architecture-draw
description: ByteBytego 스타일의 시스템 아키텍처 다이어그램을 자동 생성합니다. 프로젝트 구조를 분석하여 HTML/SVG 기반 애니메이션 다이어그램을 만듭니다. "아키텍처 그려줘", "구조도", "architecture diagram" 요청 시 사용합니다.
model: opus
---

> **권장 모델: Opus** — 이 스킬은 복잡한 SVG 좌표 계산이 필요하므로 Opus 모델을 권장합니다. Sonnet에서도 동작하지만 좌표 정확도가 떨어질 수 있습니다. 실행 전 `/model opus`로 전환하세요.

# architecture-draw

## When to use this skill

- 프로젝트 아키텍처 다이어그램을 생성할 때
- 시스템 구조를 시각화할 때
- "아키텍처 그려줘", "구조도 만들어줘", "architecture diagram" 요청 시

## Instructions

### 1단계: 코드베이스 분석

Explore 에이전트를 사용하여 프로젝트 구조를 분석합니다:

- Frontend: 프레임워크, 주요 페이지, API 호출
- Backend: 프레임워크, API 엔드포인트, 외부 서비스 연동
- External Services: DB, AI API, 인증, 기타 서비스
- Storage: 파일 시스템, 캐시, 데이터베이스
- Deployment: CI/CD, Docker, 호스팅
- Data Flow: 주요 기능별 데이터 흐름

### 2단계: 좌표 계획 (CRITICAL)

**다이어그램을 그리기 전에 반드시 각 박스의 좌표와 연결점을 먼저 계산하세요.**

#### 박스 좌표 테이블 작성

각 박스에 대해 다음을 계산합니다:

```
박스: { x, y, w, h }
중심: cx = x + w/2, cy = y + h/2
연결점:
  top    = (cx, y)
  bottom = (cx, y + h)
  left   = (x, cy)
  right  = (x + w, cy)
```

#### 화살표 연결 규칙 (MUST FOLLOW)

1. **화살표 시작/끝은 반드시 박스의 edge center (top/bottom/left/right 중 하나)에 연결**
   - 위→아래 흐름: 시작=source.bottom, 끝=target.top
   - 왼→오른 흐름: 시작=source.right, 끝=target.left
   - 오른→왼 흐름: 시작=source.left, 끝=target.right

2. **같은 행에서 여러 박스로 팬아웃할 때**:
   - 시작점은 source.bottom 한 곳에서 시작
   - 각 target.top으로 S-커브 연결
   - 시작점이 여러개면 source.bottom 주변에 균등 분배 (간격 20~30px)

3. **박스 중심에서 벗어난 연결 금지**: 절대로 박스 모서리나 임의 지점에 연결하지 마세요

4. **화살표가 다른 박스를 관통하면 안 됨**: path가 중간에 있는 박스를 지나가지 않도록 경로를 우회하세요

5. **cubic bezier의 마지막 좌표가 반드시 target의 edge center여야 함**:
   - `M sx,sy C cx1,cy1 cx2,cy2 **ex,ey**` ← (ex,ey)가 target.top/bottom/left/right 중 하나여야 함
   - 잘못된 예: `C 300,200 400,200 450,250` (450,250이 어떤 박스의 edge center도 아님)
   - 올바른 예: `C 300,200 475,200 475,232` (475,232 = Box B의 top center)

6. **4개 이상 팬아웃 시 시작점 분산 필수**:
   - target 수가 4개 이상이면 시작점을 source.bottom 주변에 균등 분배
   - 간격 = min(source.width / (target수+1), 30px)
   - 예: source cx=500, w=300, 4개 target → 시작점: 380, 440, 560, 620

#### 연결점 계산 예시

```
Box A: rect x=100 y=50 w=160 h=66
  → cx=180, cy=83
  → top=(180,50), bottom=(180,116), left=(100,83), right=(260,83)

Box B: rect x=400 y=200 w=150 h=64
  → cx=475, cy=232
  → top=(475,200), bottom=(475,264), left=(400,232), right=(550,232)

A→B 아래로 연결:
  시작 = A.bottom = (180, 116)
  끝   = B.top    = (475, 200)
  path = "M 180,116 C 180,158 475,158 475,200"
  midY = (116 + 200) / 2 = 158
```

### 3단계: HTML/SVG 다이어그램 생성

`docs/architecture.html` 파일로 ByteBytego 스타일 다이어그램을 생성합니다.

#### 디자인 규칙

**레이아웃:**

- 흰색 배경 + 검정 테두리(2.5px) 둥근 패널(border-radius: 18px)
- 패널 상단에 검정 배경 라벨 칩(둥근 pill shape)
- 2열 그리드 레이아웃 (주요 패널은 full-width)
- Inter 폰트 사용 (Google Fonts)

**박스 스타일:**

- 둥근 사각형 (rx: 12)
- 파스텔 색상 배경 + 진한 테두리:
  - 초록(#d1fae5/#34d399): Backend API
  - 파랑(#dbeafe/#60a5fa): Frontend
  - 보라(#ede9fe/#a78bfa): External Service
  - 청록(#cffafe/#22d3ee): Storage
  - 분홍(#fce7f3/#f472b6): Output
  - 노랑(#fef9c3/#facc15): Config/Prompt/Tool
  - 회색(#f1f5f9/#94a3b8): User/Proxy
  - 주황(#ffedd5/#fb923c): Download/Export
- **SVG 아이콘 (Lucide) 사용 권장** (이모지 대신):
  - CDN: `<script src="https://unpkg.com/lucide@latest"></script>` + `<i data-lucide="icon-name"></i>`
  - 또는 SVG path를 직접 인라인 (CDN 불가 시)
  - 아이콘 크기: 20x20px, stroke-width: 1.5~2
  - 색상: 박스 텍스트 색상과 동일
  - 참고: https://lucide.dev/icons
  - 아키텍처 다이어그램에서 자주 사용하는 아이콘:
    - user, globe, server, database, brain, shield, git-branch, folder, file-text
    - search, bot, zap, monitor, layers, cloud, lock, key, cpu, hard-drive
  - **이모지 폴백**: Lucide 적용이 어려우면 이모지도 허용하지만, SVG 아이콘이 더 깔끔함
- 아이콘 + 텍스트 (text-anchor="middle" 중앙 정렬)
- 아이콘과 텍스트 사이 충분한 여백 (박스 높이 64~66px)

**화살표 (CRITICAL):**

- SVG path로 그리기 (stroke-width: 2, stroke-linecap: round)
- **모든 화살표의 시작/끝 좌표는 반드시 박스의 edge center에서 시작/끝나야 함**

**화살촉 Marker 정의 (MUST INCLUDE):**
모든 SVG `<defs>` 안에 사용하는 색상별 marker를 반드시 정의해야 합니다. marker가 없으면 화살표 머리가 보이지 않습니다.

```xml
<defs>
  <!-- 사용하는 모든 색상에 대해 marker 정의 필수 -->
  <marker id="ah-gray" viewBox="0 0 10 8" refX="10" refY="4" markerWidth="7" markerHeight="6" orient="auto">
    <path d="M0,0 L10,4 L0,8 Z" fill="#94a3b8"/>
  </marker>
  <marker id="ah-green" viewBox="0 0 10 8" refX="10" refY="4" markerWidth="7" markerHeight="6" orient="auto">
    <path d="M0,0 L10,4 L0,8 Z" fill="#10b981"/>
  </marker>
  <marker id="ah-purple" viewBox="0 0 10 8" refX="10" refY="4" markerWidth="7" markerHeight="6" orient="auto">
    <path d="M0,0 L10,4 L0,8 Z" fill="#8b5cf6"/>
  </marker>
  <marker id="ah-blue" viewBox="0 0 10 8" refX="10" refY="4" markerWidth="7" markerHeight="6" orient="auto">
    <path d="M0,0 L10,4 L0,8 Z" fill="#3b82f6"/>
  </marker>
  <marker id="ah-cyan" viewBox="0 0 10 8" refX="10" refY="4" markerWidth="7" markerHeight="6" orient="auto">
    <path d="M0,0 L10,4 L0,8 Z" fill="#06b6d4"/>
  </marker>
  <marker id="ah-pink" viewBox="0 0 10 8" refX="10" refY="4" markerWidth="7" markerHeight="6" orient="auto">
    <path d="M0,0 L10,4 L0,8 Z" fill="#ec4899"/>
  </marker>
  <marker id="ah-orange" viewBox="0 0 10 8" refX="10" refY="4" markerWidth="7" markerHeight="6" orient="auto">
    <path d="M0,0 L10,4 L0,8 Z" fill="#f97316"/>
  </marker>
</defs>
```

**중요**: `refX="10"`으로 설정해야 화살촉이 선 끝에 정확히 위치합니다. `refX="9"` 이하면 화살촉이 선 끝 안쪽에 묻혀 보이지 않을 수 있습니다.

**화살표 path에 반드시 `marker-end="url(#ah-색상)"` 속성을 추가하세요:**

```xml
<path d="M 100,200 C 100,260 300,260 300,320" class="arrow" stroke="#10b981" marker-end="url(#ah-green)"/>
```

- **곡선은 반드시 cubic bezier S-커브 사용**:
  - 수직 연결: `M sx,sy C sx,midY ex,midY ex,ey` (midY = (sy+ey)/2)
  - 수평 연결: `M sx,sy C midX,sy midX,ey ex,ey` (midX = (sx+ex)/2)
  - 제어점 간 거리를 최소 60px 이상 확보
  - 꺾이는 곡선 금지 (L-shape, Q 직각 금지)
- 직선 화살표는 수직/수평만 사용: `M x,y1 L x,y2` 또는 `M x1,y L x2,y`

**팬아웃 연결 (1개 → 여러개):**

**중요**: 팬아웃의 S-커브 끝에 반드시 **수직 L 구간(30px 이상)**을 추가하여 화살촉이 정확히 아래를 향하도록 합니다. S-커브만으로 끝나면 화살촉이 비스듬하게 표시됩니다.

```
source.bottom = (sx, sy)
targets = [(t1x, t1y), (t2x, t2y), (t3x, t3y)]
turnY = t1y - 30  (target 위 30px에서 수직 전환)

올바른 패턴 (S-커브 + 수직 L):
  path1 = "M sx,sy C sx,midY t1x,midY t1x,turnY L t1x,t1y"
  path2 = "M sx,sy C sx,midY t2x,midY t2x,turnY L t2x,t2y"
  path3 = "M sx,sy C sx,midY t3x,midY t3x,turnY L t3x,t3y"

잘못된 패턴 (S-커브만, 화살촉 비스듬):
  path1 = "M sx,sy C sx,midY t1x,midY t1x,t1y"  ← 화살촉 방향 불안정!

방법 2: 시작점을 분산 (박스가 좁을 때, 간격 25px)
  path1 = "M sx-25,sy C sx-25,midY t1x,midY t1x,t1y"
  path2 = "M sx,sy    C sx,midY    t2x,midY t2x,t2y"
  path3 = "M sx+25,sy C sx+25,midY t3x,midY t3x,t3y"
```

**수렴 연결 (여러개 → 1개):**

```
sources = [(s1x, s1y), (s2x, s2y)]
target.top = (tx, ty)

path1 = "M s1x,s1y C s1x,midY tx,midY tx,ty"
path2 = "M s2x,s2y C s2x,midY tx,midY tx,ty"
```

**수평 연결 (좌↔우):**

```
source.right = (sx, sy)
target.left  = (tx, ty)

직선 (같은 높이): "M sx,sy L tx,ty"
곡선 (다른 높이): "M sx,sy C midX,sy midX,ty tx,ty"
```

**애니메이션:**

- SVG `<animateMotion>` 으로 데이터 흐름 표현
- 작은 원(r=3.5~4)이 화살표 경로를 따라 이동
- **animateMotion의 path는 반드시 해당 화살표의 path d 속성과 동일해야 함**
- 색상으로 데이터 종류 구분:
  - 주황(#fb923c): User 요청
  - 초록(#10b981): Backend 라우팅
  - 보라(#8b5cf6): External API 호출
  - 청록(#06b6d4): Storage I/O
  - 분홍(#ec4899): AI 응답
- `begin` 속성으로 시차 적용 (0.3~0.5s 간격)
- `dur` 2~2.5s, `repeatCount="indefinite"`

**패널 구성 (프로젝트에 맞게 조정):**

1. **System Overview** (full-width): 전체 데이터 흐름 요약
   - User → Frontend → Proxy → Backend → External → Storage 수직 흐름
   - 각 레이어(Backend/External/Storage)는 **개별 박스**로 표현 (바(bar) 형태 금지)
   - 배경 섹션(연한 색 rect)으로 레이어 구분
   - 박스 간 간격 넉넉하게 (100px 이상)
2. **상세 플로우 패널들** (2열): 주요 기능별 상세 흐름 (AI Review, Excel Export 등)
   - System Overview에서 다 보여주지 않은 복잡한 흐름을 별도 패널로 분리
   - **2열 패널의 내용물 높이가 다를 때**: 적은 쪽 패널의 SVG 내부 간격을 늘리지 말고, 내용물 간격은 다른 패널과 동일하게 유지 + 세로 중앙 정렬. CSS `display:flex; align-items:center;`를 `.panel-body`에 적용하거나 SVG viewBox 높이를 내용물에 맞게 줄임
3. **Deployment Pipeline** (full-width): CI/CD 파이프라인 (수평 직선)
4. 하단 Legend: 색상별 범례

**SVG viewBox 크기:**

- System Overview: 1100x580 이상 (넓고 여유있게)
- 상세 패널: 520x480 이상
- Deployment: 1080x90
- 행 간격 최소 100px 이상 (곡선이 자연스럽게 보이도록)

### 4단계: 셀프 검증

다이어그램 생성 후 모든 화살표를 검증합니다:

1. **`<defs>` 안에 사용된 모든 색상의 marker가 정의되어 있는지 확인** — marker가 없으면 화살촉이 보이지 않음
2. **모든 `<path>` 에 `marker-end="url(#ah-색상)"` 속성이 있는지 확인**
3. **각 path의 시작점(M x,y)이 source 박스의 edge center 좌표와 정확히 일치하는지 확인**
4. **각 path의 끝점(마지막 좌표)이 target 박스의 edge center 좌표와 정확히 일치하는지 확인**
5. **S-커브의 midY/midX가 (시작Y+끝Y)/2 또는 (시작X+끝X)/2 인지 확인**
6. **animateMotion의 path가 해당 화살표의 path d 속성과 동일한지 확인**

검증 체크리스트 예시:

```
화살표: User.bottom → FastAPI.top
  User rect: x=450 y=50 w=200 h=66 → bottom = (550, 116)
  FastAPI rect: x=350 y=300 w=300 h=70 → top = (500, 300)
  path d="M 550,116 C 550,208 500,208 500,300" ← OK (시작=550,116 끝=500,300)
  marker-end="url(#ah-green)" ← OK
  <defs>에 id="ah-green" marker 존재 ← OK
```

검증 실패 시 좌표를 수정합니다.

### 5단계: Playwright 스크린샷 검증 (자동)

생성된 HTML을 Playwright로 렌더링하고 스크린샷을 캡처하여 시각적으로 검증합니다.

```bash
# Windows/Mac/Linux 공통: file:// 절대 경로 사용
npx playwright screenshot --viewport-size="1400,900" --full-page "file:///${PWD}/docs/architecture.html" docs/architecture-screenshot.png
# Windows에서 안 되면:
# npx playwright screenshot --viewport-size="1400,900" --full-page "file:///D:/path/to/docs/architecture.html" docs/architecture-screenshot.png
```

캡처된 `docs/architecture-screenshot.png`를 Read tool로 읽어서 다음을 확인합니다:

1. **모든 화살표가 박스 edge center에 연결되어 있는지** 시각적으로 확인
2. **화살촉(삼각형)이 모든 화살표 끝에 보이는지** 확인
3. **화살표가 다른 박스를 관통하지 않는지** 확인
4. **텍스트가 박스 중앙에 정렬되어 있는지** 확인
5. **전체 레이아웃이 겹치거나 잘리지 않는지** 확인

**문제 발견 시**: HTML을 수정하고 다시 스크린샷 캡처 → 검증을 반복합니다. 최대 3회 반복 후 사용자에게 결과를 보고합니다.

### 6단계: 자동 수정 루프 (MUST DO)

**스크린샷 검증에서 문제가 발견되면 반드시 수정하고 다시 캡처합니다. 최대 3회 반복.**

```
Round 1: 생성 → 스크린샷 → 검증 → 문제 발견
Round 2: HTML 수정 → 스크린샷 → 검증 → 문제 발견
Round 3: HTML 수정 → 스크린샷 → 검증 → 통과 (또는 사용자에게 보고)
```

각 라운드에서 확인할 항목:

1. 화살표가 박스 edge center에 정확히 연결되는지
2. 화살촉이 모든 화살표 끝에 보이는지
3. 화살촉 방향이 올바른지 (비스듬하면 수직 L 구간 추가)
4. 화살표가 다른 박스를 관통하지 않는지
5. 텍스트가 박스 중앙에 정렬되는지
6. 패널 간 레이아웃이 겹치거나 잘리지 않는지

**3회 이내에 모든 항목이 통과될 때까지 반드시 반복하세요. 사용자에게 묻지 말고 자동으로 진행하세요.**

### 7단계: 사용자 안내

- 최종 스크린샷을 보여주고 확인 요청
- 사용자 피드백에 따라 추가 수정
