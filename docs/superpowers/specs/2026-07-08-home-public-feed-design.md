# 메인화면 공개 게시글 피드 디자인 스펙

**날짜:** 2026-07-08  
**상태:** 승인됨

---

## 개요

메인화면(Home)을 공개 게시글 피드로 개편한다. 인삿말 섹션을 제거하고, 모든 사용자가 올린 게시글을 무한 스크롤로 탐색할 수 있는 화면으로 변경한다.

---

## 변경 범위

### 1. 백엔드 — `PostListItem` 스키마 + `get_posts` 서비스

**파일:** `work_board_backend/app/api/posts/schema.py`  
`PostListItem`에 `summary: str` 필드 추가.

**파일:** `work_board_backend/app/api/posts/service.py`  
`get_posts()` 반환 시 각 post의 `content`에서 마크다운 문법(#, *, `, [] 등)을 제거하고 앞 150자를 `summary`로 계산하여 포함.

계산 방식: 정규식으로 마크다운 제거 → strip() → 앞 150자 → 150자 초과 시 "..." 추가.

### 2. 프론트엔드 — `PostCard.jsx`

**파일:** `work_board_frontend/src/components/PostCard.jsx`  
카드 내 표시 순서: 썸네일 → 제목 → summary (2줄 clamp) → 날짜.

### 3. 프론트엔드 — `Home.jsx`

**파일:** `work_board_frontend/src/pages/Home.jsx`

**상태:**
- `posts: []` — 누적 게시글 목록
- `page: number` — 현재 로드 페이지 (1부터 시작)
- `hasMore: boolean` — `posts.length < total` 여부
- `loading: boolean`

**초기 로드:** 마운트 시 `GET /posts?page=1&size=12` fetch → posts 저장.

**무한 스크롤:**
- 리스트 하단에 투명 sentinel `<div>` 배치
- `useRef` + `IntersectionObserver`로 sentinel 감지
- sentinel이 뷰포트에 진입하면 `page + 1` fetch → posts에 append
- `hasMore === false`이면 observer disconnect, "모든 글을 불러왔습니다." 텍스트 표시

**헤딩:** "최근 글" 유지.

**주석 제거:** 기존 `안녕하세요` 주석 블록 완전 삭제.

---

## 데이터 흐름

```
마운트
  └─ fetch page=1 → posts=[...12개], total=N, hasMore=(12 < N)

스크롤 → sentinel 진입
  └─ loading=true
  └─ fetch page=2 → posts=[...24개], hasMore=(24 < N)
  └─ loading=false

hasMore=false
  └─ observer.disconnect()
  └─ "모든 글을 불러왔습니다." 표시
```

---

## 경계 조건

- **게시글 0개:** "아직 작성된 글이 없습니다." 표시 (기존 유지)
- **fetch 실패:** 에러 메시지 표시, 재시도 없음
- **로딩 중 sentinel 진입 방지:** `loading === true`이면 fetch 스킵

---

## 검증 기준

- 메인화면 진입 시 게시글 12개 로드
- 스크롤 내리면 추가 12개 자동 로드
- 총 게시글 수보다 많이 로드되지 않음
- PostCard에 summary 2줄이 표시됨
- "안녕하세요" 주석 코드 없음
