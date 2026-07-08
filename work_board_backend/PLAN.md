---
DEV: DEV-001
task: task-1
title: 백엔드 PostListItem summary 필드 추가
status: in-progress
created: 2026-07-08
---

# task-1: 백엔드 PostListItem summary 필드 추가

## 배경
메인화면 피드에 게시글 요약을 표시하기 위해 목록 API 응답에 summary 필드가 필요.
DB 컬럼 추가 없이 content에서 마크다운 제거 후 앞 150자를 런타임 계산.

## 아키텍처
service.py에 make_summary() 헬퍼 추가 → router.py에서 PostListItem 생성 시 호출.

## 구현 범위
### 1. schema.py — PostListItem에 summary: str 추가
### 2. service.py — make_summary(content) 함수 추가
### 3. router.py — model_validate(p) → 명시적 생성으로 변경

## 검증
```bash
python3 -c "
import re, sys
sys.path.insert(0, '.')
from app.api.posts.service import make_summary
assert make_summary('# 제목\n\n**굵게** 텍스트') == '제목 굵게 텍스트', 'markdown 미제거'
assert make_summary('a' * 200).endswith('...'), '150자 초과 말줄임 실패'
assert make_summary('') == '', '빈 문자열 실패'
print('OK')
"
```

## 주의사항
- DB 컬럼 추가 없음, 라이브러리 추가 없음
- Post ORM 모델에 summary 컬럼이 없으므로 model_validate(p) 대신 명시적 생성 사용
- Task 2, 3(프론트엔드)이 이 필드를 사용하므로 인터페이스 변경 시 협의 필요
