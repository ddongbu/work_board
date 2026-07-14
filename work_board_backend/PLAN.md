---
DEV: DEV-004
task: task-1
title: 백엔드 댓글 수정 API
status: completed
created: 2026-07-14
---

# task-1: 백엔드 — PUT /posts/{id}/comments/{comment_id}

## 배경
댓글 수정 엔드포인트가 없어 작성 후 수정이 불가능함.

## 아키텍처
Comment 모델에 updated_at 추가, schema/service/router에 update 로직 추가.

## 구현 범위
1. models.py: Comment.updated_at 추가
2. schema.py: CommentUpdate, CommentUpdateResponse 추가
3. service.py: update_comment 함수 추가
4. router.py: PUT /{post_id}/comments/{comment_id} 엔드포인트 추가

## 검증
PUT /posts/{post_id}/comments/{comment_id} 호출 → 200 + 수정된 content 반환
