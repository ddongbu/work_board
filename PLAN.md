---
DEV: DEV-001
task: task-2
title: PostCard에 summary 표시
status: in-progress
created: 2026-07-08
---

# task-2: PostCard에 summary 표시

## 배경

Task 1에서 백엔드 API `GET /posts` 응답의 각 item에 `summary: string` 필드가 추가됨.
현재 PostCard는 `post.content`를 직접 마크다운 파싱해 미리보기를 생성하고 있으나,
이제 서버에서 제공하는 `post.summary`를 사용하는 것이 더 정확하고 효율적임.

## 아키텍처

```
API Response
  └── post.summary  (서버 생성, 마크다운 제거된 순수 텍스트)
        └── PostCard.jsx
              └── <p class="line-clamp-2"> 로 렌더링
```

## 구현 범위

### 1. `work_board_frontend/src/components/PostCard.jsx` (수정)

- `stripMarkdown` 함수 및 `preview` 변수 제거 (서버 summary로 대체)
- title 아래에 `post.summary`를 `line-clamp-2`로 렌더링
- `post.summary`가 없을 경우 해당 단락 비표시 (조건부 렌더링)
- 기존 색상 토큰 유지: `#636C76` (보조 텍스트)

## 주의사항

- `post.summary`가 빈 문자열이거나 undefined일 경우 단락을 렌더링하지 않아야 함
- 기존 카드 레이아웃(author, like, 구분선) 유지
- TailwindCSS v4 유틸리티 클래스 사용

## 검증

브라우저에서 메인화면(`http://localhost:5173`) 접속 → 카드마다 제목 아래 요약 텍스트가 2줄로 표시되는지 확인.
