---
DEV: DEV-002
task: task-2
title: 백엔드 모델 교체 및 JWT·Redis 기반 설정
status: in-progress
created: 2026-06-26
---

# Task 2: 백엔드 모델 교체 및 기반 설정

## 목표

기존 Work Board 백엔드 모델(Groups, Users, FieldDefinitions, Entities)을 제거하고
블로그 프로젝트용 모델(User, UserPassword, Post)로 교체한다.
JWT 인증 기반(security.py)과 Redis 클라이언트(redis_client.py)를 추가한다.

## 변경 파일

- `work_board_backend/requirements.txt` — passlib, python-jose, redis 패키지 추가
- `work_board_backend/.env` — JWT 및 Redis 환경변수 추가
- `work_board_backend/.env.example` — 동일 (JWT_SECRET_KEY 값 비움)
- `app/core/models.py` — 전체 교체: User, UserPassword, Post 모델
- `app/core/config.py` — JWT 및 Redis 설정 필드 추가
- `app/core/security.py` — 신규 생성: 비밀번호 해싱, JWT 토큰 생성/검증
- `app/core/redis_client.py` — 신규 생성: Redis 비동기 클라이언트
- `app/main.py` — 구 라우터 제거, Redis lifespan 추가
- `app/api/` — users/, groups/, fields/, entities/ 폴더 삭제

## 구현 계획

1. requirements.txt에 인증·Redis 패키지 추가
2. .env / .env.example에 JWT 및 Redis 환경변수 추가
3. config.py Settings 클래스에 JWT·Redis 필드 추가, DEV/PROD env_mapping 확장
4. models.py 전체 교체 (User, UserPassword, Post)
5. security.py 신규 생성 (hash_password, verify_password, create_access_token, create_refresh_token, decode_token)
6. redis_client.py 신규 생성 (init_redis, close_redis, get_redis)
7. main.py 교체 — 구 라우터 import 제거, Redis lifespan 추가
8. app/api/ 하위 구 폴더(users, groups, fields, entities) 삭제

## 검증

```bash
cd work_board_backend && docker compose up --build -d
docker logs work_board_backend --tail 20
# Expected: Application startup complete.
```
