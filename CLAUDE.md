# AGENTS.md - DEV Project Rules

## 프로젝트 개요

개인 기술 블로그 겸 포트폴리오 페이지. 공부한 내용을 게시글로 작성하고, 사진/동영상을 첨부할 수 있으며, 마이페이지에서 계정을 직접 관리할 수 있는 개인 페이지. Velog / Tistory 스타일의 기술 블로그를 목표로 함.

---

## 기술 스택

### Backend
- **Language**: Python 3.11
- **Framework**: FastAPI 0.115
- **ORM**: SQLAlchemy 2.0 (async)
- **DB Driver**: asyncpg
- **Validation**: Pydantic v2 / pydantic-settings
- **Logging**: Loguru
- **Server**: Uvicorn

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 5
- **Styling**: TailwindCSS v4
- **Routing**: React Router DOM v7
- **Lint/Format**: ESLint + Prettier

### Database
- **Engine**: PostgreSQL 16
- **Schema**: `app` 스키마 사용

### Infrastructure
- **Container**: Docker / docker-compose
- **Frontend Build**: 서버에서 직접 빌드 (`npm run build`)

---

## 디렉토리 구조

```
work_board/
├── work_board_backend/    # FastAPI 백엔드
│   ├── app/
│   │   ├── api/           # 라우터 (도메인별 분리)
│   │   ├── core/          # 설정, DB, 공통 모델
│   │   └── main.py
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .env               # 환경변수 (git 제외)
└── work_board_frontend/   # React 프론트엔드
    ├── src/
    └── vite.config.js
```

---

## 핵심 원칙

### 공통
- 주석은 **왜(Why)** 가 불명확할 때만 작성, 무엇(What)은 코드가 설명
- 환경변수는 반드시 `.env`로 관리, 하드코딩 금지
- 보안 취약점(SQL Injection, XSS, IDOR 등) 주의

### Backend
- 라우터는 도메인 단위로 분리 (`app/api/{domain}/router.py`)
- DB 접근은 반드시 async로 처리
- 환경(`local` / `prod`)에 따라 설정 클래스 자동 분기 (`LocalSettings` / `ProductionSettings`)
- 스키마는 `app` 스키마를 기본으로 사용
- 파일 업로드(이미지/동영상)는 용량 제한 및 MIME 타입 검증 필수

### Frontend
- 컴포넌트는 기능 단위로 분리
- API 호출은 별도 서비스 레이어에서 관리
- 스타일은 TailwindCSS 유틸리티 클래스 우선 사용

---

## 주요 기능 목표

- [ ] 게시글 CRUD (마크다운 에디터, 이미지/동영상 첨부)
- [ ] 카테고리 / 태그 분류
- [ ] 마이페이지 (프로필, 비밀번호 변경)
- [ ] 포트폴리오 섹션
- [ ] 관리자 전용 게시글 작성 (단일 사용자)

---

## 환경변수 규칙

| 변수 | 설명 |
|------|------|
| `API_ENV` | `local` \| `prod` — 환경 분기 키 |
| `POSTGRES_*_DEV` | 로컬 개발용 DB 접속 정보 |
| `POSTGRES_*_PROD` | 도커/프로덕션용 DB 접속 정보 |
| `CORS_ORIGINS` | 허용할 프론트엔드 오리진 (콤마 구분) |

---

## Git 규칙

### 브랜치 전략

```
master
└── develop
    └── {기능명}              ← develop에서 파생된 기능 브랜치 (예: mypage, post, auth)
        ├── task-1            ← 기능 브랜치에서 파생된 작업 단위
        ├── task-2
        └── task-n
              ↓ (--no-ff merge → {기능명})
              ↓ (merge → develop)
```

- `master`: 배포용 메인 브랜치
- `develop`: 개발 통합 브랜치
- `{기능명}`: `develop`에서 파생, 기능 단위 브랜치 (예: `mypage`, `post`, `auth`)
- `task-n`: `{기능명}` 브랜치에서 파생, 세부 작업 단위

### 작업 순서 (필수)

1. `develop`에서 `{기능명}` 브랜치 생성
2. `{기능명}`에서 `task-1` 브랜치 생성
3. **계획서 먼저 작성** — `task-n` 브랜치에 `PLAN.md` 작성 후 커밋
4. 계획서 기반으로 구현
5. 완료된 `task-n` → `{기능명}`으로 **`--no-ff` merge** (히스토리 보존)
6. 모든 task 완료 후 `{기능명}` → `develop`으로 merge

### Merge 규칙

- `task-n` → `{기능명}`: 반드시 `--no-ff` 사용
  ```bash
  git merge --no-ff task-1
  ```
- `{기능명}` → `develop`: `--no-ff` 사용 권장
- fast-forward merge 금지 — task 단위 작업 히스토리를 명확히 보존

### 계획서 (PLAN.md) 작성 규칙

- 위치: 작업 루트 또는 관련 디렉토리 내 `PLAN.md`
- 계획서 없이 구현 코드 커밋 금지

#### 계획서 템플릿

```markdown
---
DEV: DEV-{번호}
task: task-{n}
title: {작업 제목}
status: in-progress   # in-progress | completed
created: YYYY-MM-DD
---

# task-{n}: {작업 제목}

## 배경
왜 이 작업이 필요한지, 현재 구조의 문제점

## 아키텍처
변경되는 구조나 흐름을 다이어그램 또는 텍스트로 설명

## 구현 범위
### 1. `경로/파일.py` (신규 | 수정)
- 무엇을 어떻게 구현하는지 설명
- 핵심 함수 시그니처 또는 예시 코드

### 2. ...

## 주의사항
- 하위 호환, 사이드이펙트, 다른 task와의 의존성 등

## 검증
완료 기준 및 테스트 방법
```bash
검증 명령어
```
```

### 커밋 메시지

- 형식: `type. 한글 설명` (예: `feat. 게시글 작성 API 구현`)
- 타입: `feat` / `fix` / `refactor` / `docs` / `chore` / `install` / `plan`
- 계획서 커밋은 `plan. task-n 계획서 작성` 형식 사용
