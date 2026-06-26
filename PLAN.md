---
DEV: DEV-004
task: task-4
title: Post CRUD API 구현
status: in-progress
created: 2026-06-26
---

# Task 4: Post CRUD API

## 목표

FastAPI 기반 Post CRUD API를 구현한다.
목록 조회, 단건 조회, 생성, 삭제 엔드포인트를 제공하며,
생성·삭제는 JWT 인증이 필요하다.

## 변경 파일

- `app/api/posts/__init__.py` — 신규 생성
- `app/api/posts/schema.py` — PostCreate, PostResponse, PostListItem, PostListResponse 스키마
- `app/api/posts/service.py` — DB 비즈니스 로직 (get_posts, get_post, create_post, delete_post)
- `app/api/posts/router.py` — APIRouter + 4개 엔드포인트
- `app/main.py` — posts 라우터 등록

## 구현 계획

1. `app/api/posts/` 폴더 생성 및 `__init__.py` 추가
2. `schema.py` 생성: PostCreate, PostResponse, PostListItem, PostListResponse
3. `service.py` 생성: get_posts, get_post, create_post, delete_post
4. `router.py` 생성: GET /posts, POST /posts, GET /posts/{id}, DELETE /posts/{id}
5. `main.py` 수정: posts 라우터 등록

## 인터페이스

- `GET /posts?page=1&size=12` → PostListResponse (인증 불필요)
- `POST /posts` → PostResponse 201 (인증 필요)
- `GET /posts/{id}` → PostResponse (인증 불필요)
- `DELETE /posts/{id}` → 204 (인증 필요)

## 검증

```bash
cd work_board_backend && docker compose up --build -d
# Swagger http://localhost:8000/docs
# POST /auth/login → access_token 취득 → Authorize
# POST /posts → 201
# GET /posts → items 배열 확인
# GET /posts/1 → 글 상세 확인
# DELETE /posts/1 → 204
```
