---
name: mr
description: 변경사항을 commit하고 push 후 GitLab MR을 자동 생성
argument-hint: "커밋 메시지 (선택)"
---

# Merge Request 생성

현재 브랜치의 변경사항을 commit + push하고 GitLab MR을 생성하세요:

## 실행 순서

1. **사전 검증**
   - 현재 브랜치가 main이 아닌지 확인 (main이면 중단하고 경고)
   - `git status`로 변경사항 확인
   - `git diff`로 변경 내용 파악

2. **커밋**
   - 변경사항을 분석하여 커밋 메시지 작성 (인자가 있으면 그것을 사용)
   - 관련 요구사항 ID가 있으면 커밋 메시지에 포함
   - `git add`로 관련 파일 스테이징 (민감 파일 제외: .env, credentials 등)
   - `git commit`

3. **Push + MR 생성**
   ```bash
   git push origin HEAD \
     -o merge_request.create \
     -o merge_request.target=main \
     -o merge_request.title="브랜치명 기반 또는 커밋 메시지 기반 제목" \
     -o merge_request.description="변경 내용 요약 + 관련 요구사항 ID"
   ```

4. **후처리**
   - PLAN.md, PROGRESS.md 업데이트 (해당되는 경우)
   - 사용자에게 MR 생성 완료 안내

## 규칙
- main 브랜치에서는 절대 실행하지 말 것
- push 전 반드시 변경 내용을 사용자에게 보여주고 확인받을 것
- 민감 파일(.env, credentials, PAT 등)이 포함되어 있으면 경고

인자: $ARGUMENTS
