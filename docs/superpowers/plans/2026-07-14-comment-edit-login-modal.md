# 댓글 수정 + 로그인 모달 개편 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 댓글 인라인 수정 기능 추가 및 로그인 모달 버그 수정 + 2-column 디자인 개편

**Architecture:** 백엔드에 `PUT /posts/{id}/comments/{comment_id}` 엔드포인트를 추가하고, Comment 모델에 `updated_at` 컬럼을 추가한다. 프론트엔드 CommentSection.jsx에 인라인 수정 UI를 추가하고, LoginModal.jsx의 axios 인터셉터 버그(401 응답 시 강제 리다이렉트)를 수정한 뒤 2-column 레이아웃으로 디자인을 개편한다.

**Tech Stack:** Python 3.11 / FastAPI 0.115 / SQLAlchemy 2.0 async / asyncpg / Pydantic v2 / React 19 / TailwindCSS v4 / react-hook-form / Axios / Zustand

## Global Constraints

- Python 3.11, FastAPI 0.115, SQLAlchemy 2.0 (async), asyncpg, Pydantic v2
- React 19, TailwindCSS v4, React Router v7
- DB 스키마: `app` (모든 테이블은 `app.` 접두사)
- 비동기 DB 접근 필수 (`async def`, `await db.execute()`)
- 인증: `Depends(get_current_user)` from `app.api.auth.router`
- DB 세션: `Depends(get_database_session)` from `app.core.db`
- 커밋 형식: `type. 한글 설명` (feat/fix/plan/docs/refactor/chore)
- task-n 브랜치 작업 전 PLAN.md 먼저 커밋 후 구현
- task-n → comment-login-modal 머지는 반드시 `--no-ff`
- YAGNI: 요청한 기능만 구현, 추가 기능 금지

## 브랜치 설정

```
develop
└── comment-login-modal
    ├── task-1   (백엔드: PUT /posts/{id}/comments/{cid} + DB migration)
    ├── task-2   (프론트: CommentSection.jsx 인라인 수정)
    └── task-3   (프론트: LoginModal.jsx 버그 수정 + 2-column 디자인)
```

---

## File Map

| 파일 | 변경 유형 | 담당 Task |
|------|---------|---------|
| `work_board_backend/app/core/models.py` | 수정 (Comment.updated_at 추가) | Task 1 |
| `work_board_backend/app/api/posts/schema.py` | 수정 (CommentUpdate, CommentUpdateResponse 추가) | Task 1 |
| `work_board_backend/app/api/posts/service.py` | 수정 (update_comment 함수 추가) | Task 1 |
| `work_board_backend/app/api/posts/router.py` | 수정 (PUT 엔드포인트 추가) | Task 1 |
| `work_board_frontend/src/services/api.js` | 수정 (updateComment 추가, interceptor 버그 수정) | Task 2 (updateComment), Task 3 (interceptor) |
| `work_board_frontend/src/components/CommentSection.jsx` | 수정 (인라인 수정 UI) | Task 2 |
| `work_board_frontend/src/components/LoginModal.jsx` | 수정 (2-column 레이아웃 + 소셜 버튼) | Task 3 |

---

## Task 1: 백엔드 — 댓글 수정 API

**Files:**
- Modify: `work_board_backend/app/core/models.py` (Comment 모델 updated_at 추가)
- Modify: `work_board_backend/app/api/posts/schema.py` (CommentUpdate, CommentUpdateResponse 추가)
- Modify: `work_board_backend/app/api/posts/service.py` (update_comment 함수 추가)
- Modify: `work_board_backend/app/api/posts/router.py` (PUT 엔드포인트 추가)

**Interfaces:**
- Produces: `PUT /posts/{post_id}/comments/{comment_id}` → `CommentUpdateResponse`
- Produces: `service.update_comment(db, comment_id, content) -> Comment`

---

- [ ] **Step 1: develop에서 comment-login-modal 브랜치 생성**

```bash
git checkout develop
git checkout -b comment-login-modal
git checkout -b task-1
```

- [ ] **Step 2: PLAN.md 작성 및 커밋**

`work_board_backend/PLAN.md` 를 아래 내용으로 생성:

```markdown
---
DEV: DEV-004
task: task-1
title: 백엔드 댓글 수정 API
status: in-progress
created: 2026-07-14
---

# task-1: 백엔드 — PUT /posts/{id}/comments/{comment_id}

## 배경
댓글 수정 엔드포인트가 없어 작성 후 수정이 불가능함.

## 아키텍처
Comment 모델에 updated_at 추가, schema/service/router에 update 로직 추가.

## 구현 범위
1. models.py: Comment.updated_at 추가
2. schema.py: CommentUpdate, CommentUpdateResponse 추가
3. service.py: update_comment 함수 추가
4. router.py: PUT /{post_id}/comments/{comment_id} 엔드포인트 추가

## 검증
PUT /posts/{post_id}/comments/{comment_id} 호출 → 200 + 수정된 content 반환
```

```bash
git add work_board_backend/PLAN.md
git commit -m "plan. task-1 백엔드 댓글 수정 API 계획서 작성"
```

- [ ] **Step 3: Comment 모델에 updated_at 컬럼 추가**

`work_board_backend/app/core/models.py` 의 Comment 클래스에 `updated_at` 컬럼 추가:

```python
class Comment(Base):
    __tablename__ = 'comment'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='comment_pkey'),
        {'schema': 'app'}
    )

    id: Mapped[int] = mapped_column(
        Integer, Identity(always=True, start=1, increment=1), primary_key=True
    )
    post_id: Mapped[int] = mapped_column(
        Integer, ForeignKey('app.post.id', ondelete='CASCADE'), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey('app.user.id', ondelete='CASCADE'), nullable=False
    )
    parent_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey('app.comment.id', ondelete='CASCADE'), nullable=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=text('NOW()')
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=text('NOW()'), onupdate=datetime.datetime.utcnow
    )
```

- [ ] **Step 4: DB 마이그레이션 (수동) — Docker 컨테이너 내에서 실행**

```bash
docker exec -it work_board_db psql -U postgres -d work_board -c \
  "ALTER TABLE app.comment ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();"
```

기대 출력: `ALTER TABLE`

확인:
```bash
docker exec -it work_board_db psql -U postgres -d work_board -c \
  "\d app.comment"
```
`updated_at | timestamp without time zone` 컬럼이 보여야 함.

- [ ] **Step 5: schema.py에 CommentUpdate, CommentUpdateResponse 추가**

`work_board_backend/app/api/posts/schema.py` 파일 끝에 추가:

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

- [ ] **Step 6: service.py에 update_comment 함수 추가**

`work_board_backend/app/api/posts/service.py` 파일 끝에 추가:

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

`datetime` 임포트가 파일 상단에 있는지 확인. 없으면 추가:
```python
import datetime
```

- [ ] **Step 7: router.py에 PUT 엔드포인트 추가**

`work_board_backend/app/api/posts/router.py` 의 `delete_comment` 함수 바로 위에 추가:

```python
@router.put("/{post_id}/comments/{comment_id}", response_model=CommentUpdateResponse)
async def update_comment(
    post_id: int,
    comment_id: int,
    body: CommentUpdate,
    db: AsyncSession = Depends(get_database_session),
    current_user=Depends(get_current_user),
):
    result = await service.get_post(db, post_id)
    if not result:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다.")
    from sqlalchemy import select as sa_select
    from app.core.models import Comment
    comment_result = await db.execute(
        sa_select(Comment).where(Comment.id == comment_id, Comment.post_id == post_id)
    )
    comment = comment_result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다.")
    updated = await service.update_comment(db, comment_id, body.content)
    return CommentUpdateResponse(id=updated.id, content=updated.content, updated_at=updated.updated_at)
```

`router.py` 상단의 import에 `CommentUpdate`, `CommentUpdateResponse` 추가:

```python
from app.api.posts.schema import (
    PostCreate, PostUpdate, PostResponse, PostListResponse, PostListItem,
    LikeResponse, CommentCreate, CommentResponse, CommentUpdate, CommentUpdateResponse,
)
```

- [ ] **Step 8: 수동 검증 — curl로 API 테스트**

백엔드가 Docker로 실행 중인지 확인:
```bash
docker ps | grep work_board_backend
```

로그인하여 토큰 획득:
```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "TOKEN: $TOKEN"
```

댓글 작성 (게시글 ID 1이 있다고 가정):
```bash
curl -s -X POST http://localhost:8000/posts/1/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"테스트 댓글"}' | python3 -m json.tool
```
응답에서 댓글 `id` 확인 (예: 5)

댓글 수정:
```bash
curl -s -X PUT http://localhost:8000/posts/1/comments/5 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"수정된 댓글"}' | python3 -m json.tool
```

기대 응답:
```json
{
    "id": 5,
    "content": "수정된 댓글",
    "updated_at": "2026-07-14T..."
}
```

인증 없이 수정 시도 → 401:
```bash
curl -s -o /dev/null -w "%{http_code}" -X PUT http://localhost:8000/posts/1/comments/5 \
  -H "Content-Type: application/json" \
  -d '{"content":"무단 수정"}'
```
기대: `401`

- [ ] **Step 9: 커밋**

```bash
git add work_board_backend/app/core/models.py \
        work_board_backend/app/api/posts/schema.py \
        work_board_backend/app/api/posts/service.py \
        work_board_backend/app/api/posts/router.py
git commit -m "feat. 댓글 수정 API 추가 (PUT /posts/{id}/comments/{cid})"
```

- [ ] **Step 10: task-1 → comment-login-modal 머지 (--no-ff)**

```bash
git checkout comment-login-modal
git merge --no-ff task-1 -m "feat. task-1 — 댓글 수정 백엔드 API"
```

---

## Task 2: 프론트엔드 — CommentSection.jsx 인라인 수정 UI

**Files:**
- Modify: `work_board_frontend/src/services/api.js` (updateComment 함수 추가)
- Modify: `work_board_frontend/src/components/CommentSection.jsx` (인라인 수정 UI)

**Interfaces:**
- Consumes: `PUT /posts/{post_id}/comments/{comment_id}` (Task 1에서 추가됨)
- Consumes: `api.updateComment(postId, commentId, content)` → axios Promise

---

- [ ] **Step 1: task-2 브랜치 생성 (comment-login-modal에서)**

```bash
git checkout comment-login-modal
git checkout -b task-2
```

- [ ] **Step 2: PLAN.md 업데이트 및 커밋**

`work_board_backend/PLAN.md` 의 frontmatter를 다음으로 업데이트:

```markdown
---
DEV: DEV-004
task: task-2
title: 프론트엔드 CommentSection 인라인 수정 UI
status: in-progress
created: 2026-07-14
---
```

```bash
git add work_board_backend/PLAN.md
git commit -m "plan. task-2 CommentSection 인라인 수정 UI 계획서 작성"
```

- [ ] **Step 3: api.js에 updateComment 함수 추가**

`work_board_frontend/src/services/api.js` 의 `deleteAccount` 줄 다음에 추가:

```js
export const updateComment = (postId, commentId, content) =>
  api.put(`/posts/${postId}/comments/${commentId}`, { content })
```

- [ ] **Step 4: CommentSection.jsx — CommentItem에 인라인 수정 UI 추가**

`CommentItem` 컴포넌트를 아래와 같이 수정. 파일 전체를 읽고, 변경사항을 적용한다:

**import 추가** (파일 상단):
```js
import { useState, useEffect } from 'react'
import api, { updateComment } from '../services/api'
```

**CommentItem 컴포넌트** — 기존 상태 변수 아래에 수정용 상태 추가:

```jsx
function CommentItem({ comment, postId, onDeleted, currentNickname }) {
  const [showReplies, setShowReplies] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // 수정 상태
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const token = useAuthStore((s) => s.token)
```

**수정 저장 핸들러** — `submitReply` 함수 아래에 추가:

```jsx
  const handleEdit = () => {
    setEditText(comment.content)
    setIsEditing(true)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    setEditText('')
  }

  const handleEditSave = async () => {
    if (!editText.trim()) return
    setEditSubmitting(true)
    try {
      await updateComment(postId, comment.id, editText)
      setIsEditing(false)
      onDeleted()
    } catch {
      alert('수정에 실패했습니다.')
    } finally {
      setEditSubmitting(false)
    }
  }
```

**댓글 본문 렌더링 부분 수정** — 기존 `<p className="text-sm text-gray-700 ...">` 를 조건부 렌더링으로 교체:

```jsx
          {/* 수정 모드 */}
          {isEditing ? (
            <div className="mt-1">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 resize-none"
              />
              <div className="flex gap-2 mt-1.5 justify-end">
                <button
                  onClick={handleEditCancel}
                  className="px-3 py-1 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editSubmitting || !editText.trim()}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {editSubmitting ? '...' : '저장'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
          )}
```

**수정 버튼 추가** — 본인 댓글 헤더의 삭제 버튼 왼쪽에 추가:

```jsx
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-800">{comment.author_nickname}</span>
            <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
            {currentNickname === comment.author_nickname && (
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={handleEdit}
                  className="text-xs text-gray-300 hover:text-blue-400"
                >수정</button>
                <button onClick={handleDelete} className="text-xs text-gray-300 hover:text-red-400">삭제</button>
              </div>
            )}
          </div>
```

- [ ] **Step 5: CommentSection.jsx — 답글(reply)에도 인라인 수정 추가**

답글 렌더링 부분 (`showReplies && comment.replies?.length > 0` 블록)에서 각 reply에도 수정 UI 추가. 답글은 현재 inline으로 렌더링되어 있으므로, 별도 ReplyItem 컴포넌트로 추출하거나 지역 상태로 처리한다.

가장 간단한 방법: 답글 부분을 `ReplyItem` 함수 컴포넌트로 추출하여 동일한 edit 로직 적용:

```jsx
function ReplyItem({ reply, postId, onDeleted, currentNickname }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  const handleEdit = () => {
    setEditText(reply.content)
    setIsEditing(true)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
    setEditText('')
  }

  const handleEditSave = async () => {
    if (!editText.trim()) return
    setEditSubmitting(true)
    try {
      await updateComment(postId, reply.id, editText)
      setIsEditing(false)
      onDeleted()
    } catch {
      alert('수정에 실패했습니다.')
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('답글을 삭제하시겠습니까?')) return
    try {
      await api.delete(`/posts/${postId}/comments/${reply.id}`)
      onDeleted()
    } catch { alert('삭제에 실패했습니다.') }
  }

  return (
    <div className="flex gap-3">
      <Avatar nickname={reply.author_nickname} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-800">{reply.author_nickname}</span>
          <span className="text-xs text-gray-400">{formatDate(reply.created_at)}</span>
          {currentNickname === reply.author_nickname && (
            <div className="flex items-center gap-2 ml-auto">
              <button onClick={handleEdit} className="text-xs text-gray-300 hover:text-blue-400">수정</button>
              <button onClick={handleDelete} className="text-xs text-gray-300 hover:text-red-400">삭제</button>
            </div>
          )}
        </div>
        {isEditing ? (
          <div className="mt-1">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 resize-none"
            />
            <div className="flex gap-2 mt-1.5 justify-end">
              <button
                onClick={handleEditCancel}
                className="px-3 py-1 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50"
              >취소</button>
              <button
                onClick={handleEditSave}
                disabled={editSubmitting || !editText.trim()}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {editSubmitting ? '...' : '저장'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
        )}
      </div>
    </div>
  )
}
```

`showReplies && comment.replies?.length > 0` 블록에서 기존 인라인 렌더링을 `<ReplyItem />` 사용으로 교체:

```jsx
{showReplies && comment.replies?.length > 0 && (
  <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-4">
    {comment.replies.map((reply) => (
      <ReplyItem
        key={reply.id}
        reply={reply}
        postId={postId}
        onDeleted={onDeleted}
        currentNickname={currentNickname}
      />
    ))}
  </div>
)}
```

- [ ] **Step 6: 수동 검증**

프론트엔드 개발 서버가 실행 중인지 확인:
```bash
ps aux | grep "vite" | grep -v grep
```
없으면 실행:
```bash
cd work_board_frontend && npm run dev &
```

브라우저에서 http://localhost:5173 접속:
1. 로그인 후 게시글 상세 페이지로 이동
2. 댓글 작성
3. 본인 댓글에 `수정` / `삭제` 버튼이 나타나는지 확인
4. `수정` 클릭 → textarea가 기존 내용으로 채워지는지 확인
5. 내용 수정 후 `저장` → 댓글 목록에 수정된 내용 표시 확인
6. `취소` → 원본 내용 복원 확인
7. 빈 내용으로 `저장` → 버튼 disabled 확인
8. 타인 댓글에는 수정/삭제 버튼 없는지 확인

- [ ] **Step 7: 커밋**

```bash
git add work_board_frontend/src/services/api.js \
        work_board_frontend/src/components/CommentSection.jsx
git commit -m "feat. 댓글 인라인 수정 UI 추가"
```

- [ ] **Step 8: task-2 → comment-login-modal 머지 (--no-ff)**

```bash
git checkout comment-login-modal
git merge --no-ff task-2 -m "feat. task-2 — 댓글 인라인 수정 프론트엔드"
```

---

## Task 3: 프론트엔드 — LoginModal.jsx 버그 수정 + 2-column 디자인

**Files:**
- Modify: `work_board_frontend/src/services/api.js` (axios interceptor 버그 수정)
- Modify: `work_board_frontend/src/components/LoginModal.jsx` (2-column 디자인 + 소셜 버튼)

**Interfaces:**
- Consumes: 없음 (독립 변경)

### 버그 설명

`/auth/login` 이 401을 반환하면 `api.js` 의 axios interceptor가 토큰 refresh를 시도한다. refresh도 실패하면 `window.location.href = '/'` 로 리다이렉트하여 모달이 닫힌다. 로그인/회원가입 엔드포인트는 인터셉터에서 제외해야 한다.

---

- [ ] **Step 1: task-3 브랜치 생성 (comment-login-modal에서)**

```bash
git checkout comment-login-modal
git checkout -b task-3
```

- [ ] **Step 2: PLAN.md 업데이트 및 커밋**

`work_board_backend/PLAN.md` frontmatter 업데이트:

```markdown
---
DEV: DEV-004
task: task-3
title: 로그인 모달 버그 수정 + 2-column 디자인
status: in-progress
created: 2026-07-14
---
```

```bash
git add work_board_backend/PLAN.md
git commit -m "plan. task-3 로그인 모달 버그수정 및 디자인 개편 계획서 작성"
```

- [ ] **Step 3: api.js — axios interceptor 버그 수정**

`work_board_frontend/src/services/api.js` 의 response interceptor에서 auth 엔드포인트를 제외:

기존:
```js
    if (error.response?.status === 401 && !original._retry) {
```

수정:
```js
    const isAuthEndpoint = original.url?.includes('/auth/login') || original.url?.includes('/auth/signup')
    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
```

- [ ] **Step 4: LoginModal.jsx — 2-column 레이아웃 + 소셜 버튼으로 전면 개편**

`work_board_frontend/src/components/LoginModal.jsx` 를 아래 코드로 교체. 기존 폼 로직(react-hook-form, 이메일/닉네임/비밀번호 검증, email check, nickname check)은 그대로 유지하고, JSX 구조와 스타일만 변경한다.

```jsx
import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function GithubIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

export default function LoginModal({ onClose }) {
  const [mode, setMode] = useState('login')
  const [emailStatus, setEmailStatus] = useState(null)
  const [nicknameStatus, setNicknameStatus] = useState(null)
  const login = useAuthStore((s) => s.login)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields },
    setError,
    clearErrors,
    reset,
  } = useForm({
    defaultValues: { email: '', password: '', nickname: '' },
    mode: 'onTouched',
  })

  function switchMode(next) {
    setMode(next)
    setEmailStatus(null)
    setNicknameStatus(null)
    reset()
  }

  async function handleEmailBlur(val, field) {
    field.onBlur()
    if (!val || !EMAIL_RE.test(val)) return
    setEmailStatus('checking')
    try {
      const { data } = await api.get(`/auth/check-email?email=${encodeURIComponent(val)}`)
      setEmailStatus(data.available ? 'ok' : 'taken')
      if (!data.available) setError('email', { message: '이미 사용 중인 이메일입니다.' })
      else clearErrors('email')
    } catch {
      setEmailStatus(null)
    }
  }

  async function handleNicknameBlur(val, field) {
    field.onBlur()
    const trimmed = val?.trim()
    if (!trimmed || trimmed.length < 2) return
    setNicknameStatus('checking')
    try {
      const { data } = await api.get(`/auth/check-nickname?nickname=${encodeURIComponent(trimmed)}`)
      setNicknameStatus(data.available ? 'ok' : 'taken')
      if (!data.available) setError('nickname', { message: '이미 사용 중인 별명입니다.' })
      else clearErrors('nickname')
    } catch {
      setNicknameStatus(null)
    }
  }

  async function onSubmit(values) {
    if (mode === 'signup') {
      if (emailStatus === 'taken') return setError('email', { message: '이미 사용 중인 이메일입니다.' })
      if (nicknameStatus === 'taken') return setError('nickname', { message: '이미 사용 중인 별명입니다.' })
    }
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup'
      const payload = mode === 'signup'
        ? { email: values.email, password: values.password, nickname: values.nickname.trim() }
        : { email: values.email, password: values.password }
      const { data } = await api.post(endpoint, payload)
      const userInfo = mode === 'signup'
        ? { email: values.email, nickname: values.nickname.trim() }
        : await api.get('/auth/me', { headers: { Authorization: `Bearer ${data.access_token}` } }).then(r => r.data)
      login(data.access_token, userInfo)
      onClose()
    } catch (err) {
      const msg = err.response?.data?.detail
      setError('root', {
        message: typeof msg === 'string' ? msg
          : mode === 'login' ? '이메일 또는 비밀번호가 올바르지 않습니다.'
          : '회원가입에 실패했습니다. 다시 시도해주세요.',
      })
    }
  }

  function fieldClass(name, status) {
    const hasError = touchedFields[name] && errors[name]
    const isOk = status === 'ok'
    if (hasError) return 'border-red-400 focus:border-red-400 focus:ring-red-200'
    if (isOk) return 'border-blue-400 focus:border-blue-500 focus:ring-blue-200'
    return 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
  }

  function StatusMsg({ name, status }) {
    if (status === 'checking') return <p className="text-xs text-gray-400">확인 중...</p>
    if (touchedFields[name] && errors[name]) return <p className="text-xs text-red-500">{errors[name].message}</p>
    if (status === 'ok') return <p className="text-xs text-blue-600">사용 가능합니다.</p>
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden flex"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 왼쪽 패널 — 모바일에서 hidden */}
        <div className="hidden sm:flex w-2/5 bg-gray-100 flex-col items-center justify-center px-8 py-12 gap-6">
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">
              {mode === 'login' ? '환영합니다!' : '함께해요!'}
            </h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              {mode === 'login'
                ? '로그인하고 다양한\n기술 글을 살펴보세요.'
                : '지금 가입하고\n여러분의 이야기를 남겨보세요.'}
            </p>
          </div>
        </div>

        {/* 오른쪽 패널 — 폼 */}
        <div className="flex-1 px-8 py-10 flex flex-col justify-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">
            {mode === 'login' ? '로그인' : '회원가입'}
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
            {/* 이메일 */}
            <Controller
              name="email"
              control={control}
              rules={{
                required: '이메일을 입력해주세요.',
                pattern: { value: EMAIL_RE, message: '올바른 이메일 형식이 아닙니다.' },
              }}
              render={({ field }) => (
                <div>
                  <input
                    {...field}
                    type="email"
                    placeholder="이메일"
                    onBlur={(e) =>
                      mode === 'signup'
                        ? handleEmailBlur(e.target.value, field)
                        : field.onBlur()
                    }
                    onChange={(e) => { field.onChange(e); setEmailStatus(null); clearErrors('email') }}
                    className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1 ${fieldClass('email', emailStatus)}`}
                  />
                  <div className="mt-0.5 h-4">
                    <StatusMsg name="email" status={emailStatus} />
                  </div>
                </div>
              )}
            />

            {/* 별명 (회원가입만) */}
            {mode === 'signup' && (
              <Controller
                name="nickname"
                control={control}
                rules={{
                  required: '별명을 입력해주세요.',
                  minLength: { value: 2, message: '2자 이상 입력해주세요.' },
                  maxLength: { value: 50, message: '50자 이하로 입력해주세요.' },
                }}
                render={({ field }) => (
                  <div>
                    <input
                      {...field}
                      type="text"
                      placeholder="별명 (2~50자)"
                      onBlur={(e) => handleNicknameBlur(e.target.value, field)}
                      onChange={(e) => { field.onChange(e); setNicknameStatus(null); clearErrors('nickname') }}
                      className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1 ${fieldClass('nickname', nicknameStatus)}`}
                    />
                    <div className="mt-0.5 h-4">
                      <StatusMsg name="nickname" status={nicknameStatus} />
                    </div>
                  </div>
                )}
              />
            )}

            {/* 비밀번호 */}
            <Controller
              name="password"
              control={control}
              rules={{
                required: '비밀번호를 입력해주세요.',
                ...(mode === 'signup' && {
                  minLength: { value: 8, message: '8자 이상 입력해주세요.' },
                  validate: (v) => {
                    if (!/[A-Za-z]/.test(v)) return '영문자를 포함해주세요.'
                    if (!/[0-9]/.test(v)) return '숫자를 포함해주세요.'
                    return true
                  },
                }),
              }}
              render={({ field }) => (
                <div>
                  <input
                    {...field}
                    type="password"
                    placeholder={mode === 'signup' ? '비밀번호 (8자 이상, 영문+숫자)' : '비밀번호'}
                    className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1 ${fieldClass('password', null)}`}
                  />
                  <div className="mt-0.5 h-4">
                    {touchedFields.password && errors.password && (
                      <p className="text-xs text-red-500">{errors.password.message}</p>
                    )}
                  </div>
                </div>
              )}
            />

            {errors.root && (
              <p className="text-xs text-red-500 mt-1">{errors.root.message}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 rounded-md bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {isSubmitting
                ? mode === 'login' ? '로그인 중...' : '가입 중...'
                : mode === 'login' ? '로그인' : '회원가입'}
            </button>
          </form>

          {/* 소셜 로그인 구분선 */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">또는</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* 소셜 버튼 */}
          <div className="flex flex-col gap-2">
            <button className="flex items-center justify-center gap-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <GithubIcon />
              GitHub으로 계속
            </button>
            <button className="flex items-center justify-center gap-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <GoogleIcon />
              Google로 계속
            </button>
            <button className="flex items-center justify-center gap-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <FacebookIcon />
              Facebook으로 계속
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-gray-500">
            {mode === 'login' ? (
              <>
                아직 회원이 아니신가요?{' '}
                <button type="button" onClick={() => switchMode('signup')} className="text-blue-600 hover:underline">
                  회원가입
                </button>
              </>
            ) : (
              <>
                이미 계정이 있으신가요?{' '}
                <button type="button" onClick={() => switchMode('login')} className="text-blue-600 hover:underline">
                  로그인
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: 수동 검증**

브라우저에서 http://localhost:5173 접속:

1. **버그 수정 확인:** 헤더의 로그인 버튼 클릭 → 모달 오픈 → 잘못된 이메일/비밀번호 입력 → 로그인 클릭
   - 기대: 모달이 닫히지 않고 폼 하단에 "이메일 또는 비밀번호가 올바르지 않습니다." 메시지 표시
   
2. **2-column 확인:** 데스크톱 화면에서 왼쪽 회색 패널(프로필 아이콘 + "환영합니다!") + 오른쪽 폼이 나란히 보이는지 확인

3. **모바일 확인:** 브라우저 개발자도구 → 모바일 뷰(375px)에서 왼쪽 패널이 hidden되고 오른쪽 폼만 표시되는지 확인

4. **소셜 버튼:** GitHub/Google/Facebook 버튼이 표시되고 클릭해도 아무 일 없는지 확인

5. **회원가입 모드:** "회원가입" 링크 클릭 → 왼쪽 패널 텍스트가 "함께해요!"로 변경, 닉네임 필드 추가 확인

6. **로그인 성공:** 올바른 자격 증명 입력 → 모달이 닫히고 로그인 상태 확인

- [ ] **Step 6: 커밋**

```bash
git add work_board_frontend/src/services/api.js \
        work_board_frontend/src/components/LoginModal.jsx
git commit -m "fix. 로그인 실패 시 모달 닫힘 버그 수정 + 2-column 디자인 개편"
```

- [ ] **Step 7: task-3 → comment-login-modal 머지 (--no-ff)**

```bash
git checkout comment-login-modal
git merge --no-ff task-3 -m "feat. task-3 — 로그인 모달 버그 수정 및 디자인 개편"
```

---

## 최종 머지

모든 task 완료 후 comment-login-modal → develop 머지:

```bash
git checkout develop
git merge --no-ff comment-login-modal -m "feat. 댓글 수정 + 로그인 모달 개편"
```
