---
name: req
description: docs/requirements/ 에서 요구사항을 검색하거나 특정 ID의 상세 내용을 조회
argument-hint: "keyword 또는 FR-RQ-01-02"
---

# 요구사항 조회/검색

"$ARGUMENTS"에 대해 `docs/requirements/` 디렉토리에서 검색하세요:

## ID로 조회하는 경우 (예: FR-RQ-01-02, FR-TC-03-01, FR-PF-02-03)
- 해당 ID의 Description을 찾아서 표시
- 해당 항목이 속한 섹션(상위 그룹)도 함께 표시
- 관련된 다른 요구사항이 있으면 함께 안내 (예: 같은 섹션 내 항목들)

## 키워드로 검색하는 경우 (예: "Import", "Review", "TC 생성")
- 3개 요구사항 파일 모두에서 키워드 검색:
  - `[Requirements] Platform.md` (FR-PF)
  - `[Requirements] SRS_system.md` (FR-RQ)
  - `[Requirements] TC_system.md` (FR-TC)
- 매칭된 항목들을 ID와 Description으로 목록 표시
- 어떤 시스템(Platform/SRS/TC)에 속하는지 구분하여 표시

## 인자가 없는 경우
- 전체 요구사항 구조를 섹션 단위로 요약 표시 (항목 수 포함)

검색어: $ARGUMENTS
