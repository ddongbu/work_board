# 댓글 수정 + 로그인 모달 개편 설계

## 요약

댓글 수정(인라인 편집) 기능 추가와 로그인 모달의 버그 수정 및 디자인 개편을 동시에 진행한다.

---

## Feature 1: 댓글 수정

### 배경

현재 댓글은 작성(POST)과 삭제(DELETE)만 지원된다. 수정(PUT) API와 인라인 편집 UI가 없어 수정을 위해 삭제 후 재작성해야 한다.

### 백엔드 — PUT /posts/{post_id}/comments/{comment_id}

**엔드포인트:**
```
PUT /posts/{post_id}/comments/{comment_id}
Authorization: Bearer <access_token>
Content-Type: application/json

Body: { "content": "수정된 댓글 내용" }

Response 200: CommentUpdate 스키마
Response 403: 수정 권한 없음
Response 404: 댓글 또는 게시글 없음
```

**스키마 추가 (`app/api/posts/schema.py`):**
```python
class CommentUpdate(BaseModel):
    content: str

    @field_validator('content')
    @classmethod
    def content_validate(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError('댓글을 입력해주세요.')
        if len(v) > 1000:
            raise ValueError('댓글은 1000자 이하여야 합니다.')
        return v

class CommentUpdateResponse(BaseModel):
    id: int
    content: str
    updated_at: datetime

    class Config:
        from_attributes = True
```

**서비스 함수 (`app/api/posts/service.py`):**
```python
async def update_comment(db: AsyncSession, comment_id: int, content: str) -> Comment:
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one()
    comment.content = content
    comment.updated_at = datetime.datetime.utcnow()
    await db.commit()
    await db.refresh(comment)
    return comment
```

**Comment 모델 (`app/core/models.py`):** `updated_at` 컬럼 추가
```python
updated_at: Mapped[datetime.datetime] = mapped_column(
    DateTime, server_default=text('NOW()'), onupdate=datetime.datetime.utcnow
)
```

**DB 마이그레이션 (수동):**
```sql
ALTER TABLE app.comment ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
```

**라우터 추가 (`app/api/posts/router.py`):**
```python
@router.put("/{post_id}/comments/{comment_id}", response_model=CommentUpdateResponse)
async def update_comment(
    post_id: int,
    comment_id: int,
    body: CommentUpdate,
    db: AsyncSession = Depends(get_database_session),
    current_user=Depends(get_current_user),
):
    # post 존재 확인
    # comment 존재 확인 + post_id 일치 확인
    # comment.user_id != current_user.id → 403
    # service.update_comment 호출
```

### 프론트엔드 — CommentSection.jsx 인라인 수정 UI

**흐름:**
1. 본인 댓글에 `수정` 버튼 노출 (삭제 버튼 왼쪽)
2. `수정` 클릭 → textarea가 기존 content로 채워지며 표시, 저장/취소 버튼
3. `저장` 클릭 → PUT 호출 → 성공 시 onDeleted()로 전체 재조회
4. `취소` 클릭 → 편집 모드 해제, 원본 복원
5. 빈 내용은 저장 불가 (disabled)

**CommentItem에 추가할 상태:**
```jsx
const [isEditing, setIsEditing] = useState(false)
const [editText, setEditText] = useState('')
const [editSubmitting, setEditSubmitting] = useState(false)
```

**수정 버튼 위치:** 삭제 버튼 왼쪽, 동일한 스타일 (`text-xs text-gray-300 hover:text-blue-400`)

**답글(reply)도 동일하게 수정 가능** — reply 렌더링 코드에도 inline edit 적용

**api.js에 추가:**
```js
updateComment: (postId, commentId, content) =>
  axiosInstance.put(`/posts/${postId}/comments/${commentId}`, { content }),
```

---

## Feature 2: 로그인 모달 버그 수정 + 디자인 개편

### 버그: 로그인 실패 시 폼이 닫힘

현재 `setError('root', ...)` 호출 후 모달이 닫히는 현상이 있다. 원인을 파악하고 수정한다. 수정 방향: 로그인 실패 시 모달은 유지되고, 폼 하단에 인라인 에러 메시지만 표시된다.

### 디자인 개편

**2-column 레이아웃 (데스크톱 기준):**
```
┌─────────────────────┬──────────────────────────────┐
│  왼쪽 패널           │  오른쪽 패널                   │
│  (배경: 회색/다크)   │                               │
│                     │  이메일 입력                   │
│  hero.png 이미지     │  비밀번호 입력                 │
│  (선택적)            │                               │
│                     │  [로그인 버튼]                 │
│  "환영합니다!"       │                               │
│  (서브텍스트)        │  ───── 또는 ─────             │
│                     │  [GitHub] [Google] [Facebook] │
│                     │  (UI만, 기능 없음)             │
│                     │                               │
│                     │  회원가입 링크                 │
└─────────────────────┴──────────────────────────────┘
```

- 모달 최대 너비: `max-w-2xl` (기존 `max-w-sm` → 확장)
- 왼쪽 패널: `w-2/5`, 배경 `bg-gray-100 dark:bg-gray-800`, 이미지 + 텍스트 중앙 정렬
- 오른쪽 패널: `w-3/5`, 기존 폼 그대로 이동
- 모바일(`sm` 미만): 왼쪽 패널 hidden, 오른쪽 패널만 `w-full`

**소셜 버튼 (UI only):**
```jsx
// 버튼만 렌더링, onClick 없음 (미구현 안내 tooltip 불필요)
<button className="...flex items-center gap-2...">
  <GithubIcon /> GitHub으로 계속
</button>
```
아이콘: SVG 인라인 (별도 라이브러리 없이)

**hero.png 경로:** `public/hero.png` 또는 `src/assets/hero.png` — 없으면 gradient placeholder로 대체

**회원가입 모드:** 왼쪽 패널 텍스트 "회원가입"으로 변경, 오른쪽 폼에 닉네임 필드 포함 (기존 로직 유지)

---

## 브랜치 전략

```
develop
└── comment-login-modal
    ├── task-1   (백엔드: PUT /posts/{id}/comments/{cid} + DB 마이그레이션)
    ├── task-2   (프론트: CommentSection.jsx 인라인 수정 UI)
    └── task-3   (프론트: LoginModal.jsx 버그 수정 + 2-column 디자인)
```

---

## 검증 기준

**댓글 수정:**
- 본인 댓글: 수정/삭제 버튼 모두 노출
- 타인 댓글: 수정/삭제 버튼 없음
- 수정 textarea에 기존 내용 pre-fill
- 빈 내용 → 저장 버튼 disabled
- 저장 성공 → 편집 모드 해제, 새 내용 표시

**로그인 모달:**
- 이메일/비밀번호 오류 → 모달 유지, 폼 하단에 에러 메시지 표시
- 2-column 레이아웃 데스크톱에서 정상 표시
- 모바일(375px)에서 1-column (왼쪽 패널 hidden)
- 소셜 버튼 UI 표시됨 (클릭해도 아무 일 없음)
