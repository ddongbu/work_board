---
DEV: DEV-003
task: task-3
title: Auth API 구현 (signup / login / logout / refresh)
status: in-progress
created: 2026-06-26
---

# Task 3: Auth API (signup / login / logout / refresh)

## 목표

FastAPI 기반 Auth API를 구현한다.
signup, login, logout, refresh 엔드포인트를 제공하며,
JWT access token과 httpOnly 쿠키 기반 refresh token을 사용한다.

## 변경 파일

- `app/api/auth/__init__.py` — 신규 생성
- `app/api/auth/schema.py` — SignupRequest, LoginRequest, TokenResponse 스키마
- `app/api/auth/service.py` — DB/Redis 비즈니스 로직 (create_user, authenticate_user 등)
- `app/api/auth/router.py` — APIRouter + get_current_user + 4개 엔드포인트
- `app/main.py` — auth 라우터 등록

## 구현 계획

1. `app/api/auth/` 폴더 생성 및 `__init__.py` 추가
2. `schema.py` 생성: SignupRequest, LoginRequest, TokenResponse
3. `service.py` 생성: create_user, authenticate_user, get_user_by_id, save/verify/delete_refresh_token
4. `router.py` 생성: get_current_user (Task 4용), /signup, /login, /logout, /refresh
5. `main.py` 수정: auth 라우터 등록

## 검증

```bash
cd work_board_backend && docker compose up --build -d
# Swagger http://localhost:8000/docs
# POST /auth/signup → 201 with access_token
# POST /auth/login  → 200 with access_token
# POST /auth/logout → 200
# POST /auth/refresh → 200 with new access_token
```
