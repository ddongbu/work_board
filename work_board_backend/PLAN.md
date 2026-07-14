---
DEV: DEV-003
task: task-1
title: 백엔드 — User 모델 + mypage 도메인 + upload 폴더 분기
status: completed
created: 2026-07-14
---

# task-1: 백엔드 마이페이지 API

## 배경
마이페이지 기능 구현을 위해 User 모델에 profile_image_url 컬럼을 추가하고,
프로필 수정·비밀번호 변경·회원 탈퇴 API를 신규 도메인으로 분리한다.

## 구현 범위
- app/core/models.py: User.profile_image_url 컬럼 추가
- app/api/auth/schema.py: UserResponse에 profile_image_url 포함
- app/api/upload/router.py: folder 파라미터로 posts/ vs profiles/ 분기
- app/api/mypage/: 신규 도메인 (schema, service, router)
- app/main.py: mypage 라우터 등록

## 검증
서버 기동 후:
- POST /upload?folder=profiles 로 이미지 업로드 확인
- PUT /mypage/profile 로 닉네임+이미지 변경 확인
- PUT /mypage/password 로 비밀번호 변경 확인
- DELETE /mypage/account 로 계정 삭제 확인
