---
DEV: DEV-002
task: task-1
title: 좋아요·댓글 DB 모델 및 백엔드 API
status: in-progress
created: 2026-07-08
---

# task-1: 좋아요·댓글·게시글 수정 백엔드

## 배경
게시글 상세 페이지에 좋아요(하트), 댓글/대댓글, 게시글 수정 기능이 없음.
프론트에서 해당 API를 호출할 수 있도록 백엔드를 먼저 완성한다.

## 아키텍처

```
app.post_like  (post_id, user_id) UNIQUE
app.comment    (id, post_id, user_id, parent_id nullable, content, created_at)

POST   /posts/{id}/like                   → 좋아요 토글 (로그인 필요)
GET    /posts/{id}/like                   → 좋아요 수 + 내 좋아요 여부
GET    /posts/{id}/comments               → 댓글 목록 (대댓글 포함)
POST   /posts/{id}/comments               → 댓글 작성 (로그인 필요)
POST   /posts/{id}/comments/{cid}/replies → 대댓글 작성 (로그인 필요)
DELETE /posts/{id}/comments/{cid}         → 댓글 삭제 (작성자만)
PUT    /posts/{id}                        → 게시글 수정 (작성자만)
```

## 구현 범위

### 1. `app/core/models.py` (수정)
- `PostLike`: post_id FK, user_id FK, UniqueConstraint(post_id, user_id)
- `Comment`: post_id FK CASCADE, user_id FK CASCADE, parent_id nullable self-FK CASCADE, content Text

### 2. `app/api/posts/schema.py` (수정)
- `PostUpdate`: title/content/thumbnail_url/is_published 모두 optional
- `LikeResponse`: count, liked
- `CommentCreate`: content (1~1000자), parent_id optional
- `CommentResponse`: id, author_nickname, content, created_at, replies[]

### 3. `app/api/posts/service.py` (수정)
- `toggle_like`, `get_like_status`, `update_post`
- `get_comments`, `create_comment`, `delete_comment`

### 4. `app/api/posts/router.py` (수정)
- 엔드포인트 7개 추가
- PUT /{post_id}: 작성자만 수정 (403 체크)
- DELETE 댓글: 작성자만 삭제 (403 체크)

## 주의사항
- `Base.metadata.create_all`이 lifespan에서 자동 실행 → 신규 테이블은 별도 마이그레이션 불필요
- 댓글 depth는 1단계 (대댓글의 대댓글 없음) — parent_id 있으면 최상위 댓글만 parent로 허용
- 좋아요 토글: 이미 존재하면 삭제, 없으면 추가
- 대댓글 삭제 시 부모 댓글 삭제 시 CASCADE 적용

## 검증
```bash
curl -X PUT http://localhost:8000/posts/1 -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" -d '{"title":"수정된 제목"}'
curl -X POST http://localhost:8000/posts/1/like -H "Authorization: Bearer <token>"
curl http://localhost:8000/posts/1/comments
```
