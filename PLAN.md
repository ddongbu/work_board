---
DEV: DEV-002
task: task-2
title: 게시글 상세 UI 개편 + 좋아요·댓글·수정 프론트엔드
status: completed
created: 2026-07-08
---

# task-2: 프론트엔드 — PostDetail 개편 + 좋아요·댓글·게시글수정

## 배경
PostDetail이 단순 렌더만 하고 수정/삭제가 하단에만 있음.
스크린샷 기준으로 헤더(작성자·날짜·수정·삭제)와 왼쪽 사이드 좋아요, 하단 댓글 섹션을 추가한다.

## 아키텍처

```
PostDetail.jsx
  ├── 헤더: 제목 / 작성자·날짜 (좌) + 수정·삭제 (우, 로그인+본인만)
  ├── 왼쪽 플로팅: 하트 버튼 + 좋아요 수
  ├── 본문: ReactMarkdown
  └── CommentSection.jsx
        ├── "N개의 댓글" 헤더
        ├── 입력 폼 (로그인 시)
        └── 댓글 목록 (CommentItem)
              └── 대댓글 토글 + 대댓글 입력 폼

PostWrite.jsx → 수정 모드 지원 (id param 있으면 PUT, 없으면 POST)
App.jsx       → /posts/:id/edit 라우트 추가
```

## 구현 범위

### 1. `src/pages/PostDetail.jsx` (전면 개편)
- 헤더: 제목, 작성자·날짜(좌), 수정·삭제(우, 본인만)
- 왼쪽 사이드: 하트(♥) + count, 마운트 시 GET /posts/:id/like
- 수정 버튼: /posts/:id/edit 이동

### 2. `src/components/CommentSection.jsx` (신규)
- 댓글 수 표시, textarea 폼, 댓글 목록
- 대댓글: "N개의 답글" 버튼 클릭 시 토글, 대댓글 입력 폼

### 3. `src/pages/PostWrite.jsx` (수정 모드 추가)
- useParams로 id 감지 → id 있으면 기존 글 로드(GET) 후 PUT 제출
- /posts/:id/edit 경로에서 재사용

### 4. `src/App.jsx` (수정)
- `/posts/:id/edit` 라우트 추가

## 주의사항
- 좋아요는 비로그인도 수 확인 가능, 클릭은 로그인 필요
- 수정/삭제 버튼은 post.user_id 대신 authStore 닉네임으로 본인 확인 불가 → API가 403 반환하면 alert
- CommentSection은 PostDetail에서 post_id prop으로 받음

## 검증
- 비로그인: 좋아요 수 보임, 하트 클릭 시 로그인 모달 유도
- 로그인: 하트 클릭 시 토글, 댓글 작성 가능
- 본인 글: 수정/삭제 버튼 노출
