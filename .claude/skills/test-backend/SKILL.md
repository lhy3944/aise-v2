---
name: test-backend
description: 백엔드 pytest 실행 및 결과 리포팅. 전체 또는 특정 모듈 테스트 가능.
argument-hint: "[module] (예: project, requirement, glossary, assist, all)"
---

# 백엔드 테스트 실행

## 테스트 실행

$ARGUMENTS가 "all"이거나 비어있으면 전체 테스트, 아니면 해당 모듈만 실행:

```bash
cd /home/aiqa/source/aise2.0/backend

# 전체
uv run pytest tests/ -v --tb=short

# 특정 모듈
uv run pytest tests/test_$ARGUMENTS.py -v --tb=short
```

## 결과 리포팅

1. **요약**: 전체 N건, 통과 N건, 실패 N건
2. **실패 목록**: 테스트명 + 에러 메시지 (있을 경우)
3. **권장 조치**: 실패 원인에 대한 간단한 분석

## 커버리지 (선택)

```bash
uv run pytest tests/ -v --cov=src --cov-report=term-missing --tb=short
```
