---
DEV: DEV-001
task: task-1
title: Redis infra docker-compose 추가
status: in-progress
created: 2026-06-26
---

# Task 1: Redis infra 추가

## 목표

`infra/docker-compose.yml`에 Redis 컨테이너를 추가하여 백엔드가 hostname `redis`로 접근할 수 있도록 한다.

## 변경 파일

- `infra/docker-compose.yml` — redis 서비스 추가

## 구현 계획

1. `infra/docker-compose.yml`의 `services:` 블록에 redis 서비스 추가
   - 이미지: `redis:7-alpine`
   - 컨테이너명: `work_board_redis`
   - 포트: `6379:6379`
   - 네트워크: `work_board_net` (기존 postgres와 동일)
   - healthcheck: `redis-cli ping`
   - restart: `unless-stopped`

## 검증

```bash
cd infra && docker-compose up -d redis
docker exec work_board_redis redis-cli ping
# Expected: PONG
```
