---
name: branch
description: main 최신화 후 feature 브랜치를 생성하여 작업 시작
argument-hint: "feat/branch-name"
---

# Feature 브랜치 생성

"$ARGUMENTS" 이름으로 feature 브랜치를 생성하세요:

## 실행 순서

1. **현재 상태 확인**
   - `git status`로 uncommitted 변경사항 확인
   - 변경사항이 있으면 사용자에게 알리고 처리 방법 확인 (stash 또는 commit)

2. **main 최신화**
   - `git checkout main`
   - `git pull origin main`

3. **브랜치 생성 및 체크아웃**
   - `git checkout -b $ARGUMENTS`

4. **확인**
   - 현재 브랜치가 올바른지 `git branch --show-current`로 확인
   - 사용자에게 브랜치 생성 완료 안내

## 브랜치 네이밍 규칙
- 인자가 없으면 사용자에게 브랜치 이름을 물어볼 것
- 권장 형식: `feat/기능명`, `fix/버그명`, `refactor/대상`, `docs/문서명`

인자: $ARGUMENTS
