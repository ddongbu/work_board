---
DEV: DEV-001
task: task-3
title: Home 무한 스크롤 구현
status: in-progress
created: 2026-07-08
---

# task-3: Home 무한 스크롤 구현

## 배경

메인화면이 현재 단일 요청(`/posts?page=1&size=20`)으로 고정된 목록을 보여주고 있음.
게시글이 늘어날수록 초기 로드 비용이 증가하고, 사용자 경험이 저하됨.
IntersectionObserver 기반 무한 스크롤로 필요한 만큼만 점진적으로 로드하도록 전환.

## 아키텍처

```
Home.jsx
  ├── stateRef { page, loading, hasMore }   ← stale closure 방지용 Ref
  ├── useState: posts, loading, hasMore, error
  ├── fetchNext()                           ← stateRef 참조, API 호출 후 양쪽 동기화
  ├── useEffect(fetchNext, [])              ← 초기 로드
  ├── useEffect(IntersectionObserver, [])  ← sentinel 감지 시 fetchNext 호출
  └── <div ref={sentinelRef} />            ← 뷰포트 진입 감지 트리거
```

## 구현 범위

### 1. `work_board_frontend/src/pages/Home.jsx` (전체 교체)

- `useReducer` 패턴 제거, `useState` + `stateRef` 패턴으로 교체
- IntersectionObserver 마운트 시 한 번만 등록 (빈 deps 배열)
- `SIZE = 12` 고정, `page * SIZE < data.total` 조건으로 `hasMore` 판단
- 헤딩 "최근 글" 유지, 색상 `#1F2328` / `#636C76` 사용
- "안녕하세요" 관련 주석·코드 완전 제거

## 주의사항

- IntersectionObserver deps 배열이 비어야 함 — `fetchNext`를 deps에 넣으면 재등록 반복 발생
- stateRef와 React state 양쪽을 동기화해야 UI와 로직이 일치
- 외부 라이브러리 추가 금지 (IntersectionObserver는 브라우저 내장)

## 검증

1. 페이지 진입 시 게시글 12개 로드
2. 스크롤을 맨 아래로 내리면 "불러오는 중..." 표시 후 추가 게시글 append
3. 전체 로드 완료 시 "모든 글을 불러왔습니다." 표시
4. 게시글이 없을 때 "아직 작성된 글이 없습니다." 표시
