---
name: research
description: 주제를 조사하고 결과를 references/ 디렉토리에 저장
argument-hint: "주제 또는 URL"
---

# 조사 및 레퍼런스 저장

"$ARGUMENTS"에 대해 조사하고 결과를 저장하세요:

## 1. 조사
- 주어진 주제 또는 URL에 대해 조사
- 핵심 내용, 아키텍처, 기술적 특징을 분석

## 2. 저장
- `references/` 디렉토리에 마크다운 파일로 저장
- 파일명: `YYYY-MM-DD_주제.md` (오늘 날짜 사용)
- 아래 프론트매터 포함:

```yaml
---
title: 제목
date: YYYY-MM-DD
source: 출처 URL 또는 설명
tags: [관련, 태그]
---
```

## 3. 내용 구조
- 개요
- 핵심 분석 내용
- AISE 2.0 MVP 적용 포인트 (해당 시)

## 기존 레퍼런스 확인
- 저장 전 `references/` 디렉토리에 같은 주제의 파일이 있는지 확인
- 있으면 새로 만들지 말고 기존 파일을 업데이트

조사 주제: $ARGUMENTS
