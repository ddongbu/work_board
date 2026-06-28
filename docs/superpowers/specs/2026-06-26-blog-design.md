# 블로그 기능 설계 — 유퀘스트 개인 기술 블로그

**작성일:** 2026-06-26  
**브랜치:** `develop → blog → task-1 ~ task-6`  
**목표:** Velog 스타일 개인 기술 블로그. 글 CRUD, 이미지 업로드, 이메일 인증.

---

## 1. DB 설계

기존 테이블(`groups`, `users`, `field_definitions`, `entities`) 전부 제거 후 아래로 교체.

### app.user
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | int, PK, identity | 유저 ID |
| email | varchar(255), unique | 이메일 (로그인 ID) |
| created_at | timestamp | 생성일 |
| updated_at | timestamp | 수정일 |

### app.user_pw
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | int, PK, identity | PK |
| user_id | int, FK → app.user.id | 유저 참조 |
| password_hash | varchar(255) | bcrypt 해시 |
| is_active | bool | 소프트 딜리트 (false = 비활성) |
| created_at | timestamp | 생성일 |
| updated_at | timestamp | 수정일 |

비밀번호 변경 시: 기존 row `is_active=false` → 새 row insert. 유효 비밀번호는 `is_active=true` 최신 1건.

### app.post
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | int, PK, identity | 글 ID |
| title | varchar(500) | 제목 |
| content | text | 마크다운 원문 |
| thumbnail_url | varchar(1000), nullable | Firebase Storage URL |
| is_published | bool | 발행 여부 |
| created_at | timestamp | 생성일 |
| updated_at | timestamp | 수정일 |

---

## 2. 백엔드 아키텍처

### 디렉토리 구조
```
app/
├── api/
│   ├── auth/
│   │   └── router.py      # POST /auth/login, /auth/logout, /auth/refresh
│   └── posts/
│       └── router.py      # GET/POST /posts, GET/DELETE /posts/{id}
├── core/
│   ├── models.py          # User, UserPassword, Post (기존 전부 교체)
│   ├── config.py          # Redis, JWT 설정 추가
│   ├── db.py              # 기존 유지
│   └── security.py        # bcrypt 해시/검증, JWT 생성/검증 (신규)
└── main.py                # 라우터 교체
```

### 인증 흐름
```
로그인 (POST /auth/login)
  → email로 user 조회 → is_active=true인 user_pw의 bcrypt 검증
  → Access Token (15분) 반환 (JSON body)
  → Refresh Token (7일) Set-Cookie httpOnly
  → Redis: SET refresh:{user_id} {refresh_token} EX 604800

API 호출
  → Authorization: Bearer {access_token}
  → 만료 시 POST /auth/refresh → Redis 검증 → 새 Access Token

로그아웃 (POST /auth/logout)
  → Redis: DEL refresh:{user_id}
  → 쿠키 삭제
```

### 엔드포인트
```
POST   /auth/signup         # 회원가입
POST   /auth/login          # 로그인
POST   /auth/logout         # 로그아웃 (인증 필요)
POST   /auth/refresh        # 토큰 갱신

GET    /posts               # 글 목록 (공개, 페이지네이션)
POST   /posts               # 글 작성 (인증 필요)
GET    /posts/{id}          # 글 상세 (공개)
DELETE /posts/{id}          # 글 삭제 (인증 필요)
```

### 신규 환경변수 (.env)
```
JWT_SECRET_KEY=
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Redis - DEV
REDIS_HOST_DEV=localhost
REDIS_PORT_DEV=6379

# Redis - PROD (Docker)
REDIS_HOST_PROD=redis
REDIS_PORT_PROD=6379
```

---

## 3. 인프라 변경

`infra/docker-compose.yml`에 Redis 서비스 추가.

```yaml
redis:
  image: redis:7-alpine
  container_name: work_board_redis
  ports:
    - "6379:6379"
  networks:
    - work_board_net
```

---

## 4. 프론트엔드 아키텍처

### 디렉토리 구조
```
src/
├── components/
│   ├── Header.jsx          # 로고 + 로그인 버튼 (우측 상단)
│   ├── LoginModal.jsx      # 반투명 오버레이, 이메일 로그인 폼
│   └── PostCard.jsx        # 썸네일 + 제목 + 날짜 카드
├── pages/
│   ├── Home.jsx            # 최신 글 카드 그리드 (4열)
│   ├── PostDetail.jsx      # 글 상세 (마크다운 렌더링)
│   └── PostWrite.jsx       # 글 작성 (마크다운 에디터, 인증 필요)
├── services/
│   └── api.js              # axios 인스턴스, 인터셉터
├── store/
│   └── authStore.js        # zustand 인증 상태
└── App.jsx                 # 라우팅
```

### 추가 라이브러리
| 패키지 | 용도 |
|--------|------|
| `@uiw/react-md-editor` | 마크다운 에디터 + 미리보기 |
| `react-markdown` + `remark-gfm` | 상세 페이지 마크다운 렌더링 |
| `axios` | API 통신 |
| `zustand` | 인증 상태 전역 관리 |
| `firebase` | Storage 이미지 업로드 |

### 라우팅
```
/           → Home (공개)
/posts/:id  → PostDetail (공개)
/write      → PostWrite (비로그인 시 LoginModal 표시)
```

### 인증 상태 관리
- Access Token: zustand store (메모리)
- 새로고침 시 /auth/refresh로 토큰 재발급 (Refresh Token은 httpOnly 쿠키)
- 401 응답 시 자동 refresh 후 재요청 (axios 인터셉터)

---

## 5. Task 분해

| Task | 내용 | 브랜치 |
|------|------|--------|
| task-1 | 인프라 — Redis infra docker-compose 추가 | `blog/task-1` |
| task-2 | 백엔드 모델 — 기존 제거, User/UserPw/Post + security.py | `blog/task-2` |
| task-3 | 백엔드 Auth API — login/logout/refresh | `blog/task-3` |
| task-4 | 백엔드 Post CRUD API | `blog/task-4` |
| task-5 | 프론트 기반 — title, Header, LoginModal, Home 카드 그리드 | `blog/task-5` |
| task-6 | 프론트 글 — PostDetail, PostWrite + Firebase 업로드 | `blog/task-6` |

각 task: PLAN.md 먼저 커밋 → 구현 → `--no-ff` merge to `blog`
