---
DEV: DEV-003
task: task-2
title: 프론트엔드 — 헤더 드롭다운 + 설정 페이지
status: completed
created: 2026-07-14
---

# task-2: 프론트엔드 마이페이지 설정

## 배경
헤더를 드롭다운 형태로 개편하고, 벨로그 스타일의 /settings 페이지를 구현한다.

## 구현 범위
- authStore.js: updateUser 액션 추가
- api.js: mypage API 함수 추가
- Header.jsx: 프로필 사진 원형 + 드롭다운 (설정, 로그아웃)
- Settings.jsx: 프로필 사진 업로드, 닉네임 수정, 비밀번호 변경, 회원 탈퇴
- App.jsx: /settings 라우트 추가 (비로그인 시 / 리다이렉트)

## 검증
- 헤더: 프로필 이미지 클릭 시 드롭다운 표시
- 설정: 프로필 사진 업로드 → 헤더 즉시 반영
- 설정: 닉네임 변경 → 헤더 즉시 반영
- 설정: 비밀번호 변경 후 재로그인 가능
- 설정: 회원 탈퇴 → 홈으로 이동
