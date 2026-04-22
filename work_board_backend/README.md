# FastAPI PostgreSQL Project

FastAPI와 PostgreSQL을 사용하는 기본 프로젝트입니다.

## 기술 스택

- FastAPI
- PostgreSQL
- SQLModel
- Docker & Docker Compose

## 프로젝트 구조

```
.
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 애플리케이션 진입점
│   ├── models.py            # SQLModel 모델
│   ├── api/
│   │   ├── __init__.py
│   │   └── items.py         # Items API 라우터
│   └── core/
│       ├── __init__.py
│       ├── config.py        # 설정
│       └── db.py            # 데이터베이스 설정
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## 시작하기

### 필수 요구사항

- Docker
- Docker Compose

### 실행 방법

1. 프로젝트 클론 또는 다운로드

2. Docker Compose로 실행:
```bash
docker-compose up --build
```

3. 애플리케이션 접속:
- API: http://localhost:8000
- API 문서 (Swagger): http://localhost:8000/docs
- Alternative API 문서 (ReDoc): http://localhost:8000/redoc

### 데이터베이스 연결 정보

- Host: localhost
- Port: 5432
- Database: app
- User: postgres
- Password: postgres

## API 엔드포인트

### 기본 엔드포인트

- `GET /` - 환영 메시지
- `GET /health` - 헬스 체크

### Items API

- `POST /api/items/` - 새 아이템 생성
- `GET /api/items/` - 모든 아이템 조회
- `GET /api/items/{item_id}` - 특정 아이템 조회
- `DELETE /api/items/{item_id}` - 아이템 삭제

### 예시 요청

아이템 생성:
```bash
curl -X POST "http://localhost:8000/api/items/" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Item", "description": "This is a test item"}'
```

모든 아이템 조회:
```bash
curl http://localhost:8000/api/items/
```

## 개발

로컬에서 개발할 때는 볼륨 마운트가 설정되어 있어 코드 변경 시 자동으로 리로드됩니다.

## 중지

```bash
docker-compose down
```

데이터베이스 볼륨까지 삭제하려면:
```bash
docker-compose down -v
```
