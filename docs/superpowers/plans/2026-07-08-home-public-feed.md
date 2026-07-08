# 메인화면 공개 게시글 피드 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메인화면을 공개 게시글 피드로 개편 — 무한 스크롤 + 게시글 요약(summary) 표시

**Architecture:** 백엔드에서 `PostListItem`에 `summary` 필드를 추가하고 마크다운을 제거한 본문 앞 150자를 반환한다. 프론트엔드는 `IntersectionObserver`로 스크롤 끝 sentinel div를 감지해 다음 페이지를 fetch하고 posts 배열에 누적한다.

**Tech Stack:** Python 3.11 / FastAPI / Pydantic v2, React 19 / TailwindCSS v4

## Global Constraints

- 외부 라이브러리 추가 금지 — IntersectionObserver는 브라우저 내장 API 사용
- 백엔드 DB 스키마(컬럼) 변경 없음 — summary는 content에서 런타임 계산
- 페이지 size 고정 12
- 스타일은 기존 TailwindCSS 유틸리티 클래스 패턴 준수 (색상: `#1F2328`, `#636C76`, `#D0D7DE`)
- CLAUDE.md 브랜치 전략 준수: `develop → home-feed → task-1, task-2, task-3` 순으로 작업

---

## 파일 변경 목록

| 파일 | 작업 |
|------|------|
| `work_board_backend/app/api/posts/schema.py` | 수정 — `PostListItem`에 `summary: str` 추가 |
| `work_board_backend/app/api/posts/service.py` | 수정 — `make_summary()` 함수 추가 |
| `work_board_backend/app/api/posts/router.py` | 수정 — `PostListItem` 생성 방식 변경 |
| `work_board_frontend/src/components/PostCard.jsx` | 수정 — summary 필드 표시 |
| `work_board_frontend/src/pages/Home.jsx` | 수정 — 무한 스크롤 구현, 주석 코드 제거 |

---

### Task 1: 백엔드 — summary 필드 추가

**Files:**
- Modify: `work_board_backend/app/api/posts/schema.py`
- Modify: `work_board_backend/app/api/posts/service.py`
- Modify: `work_board_backend/app/api/posts/router.py`

**Interfaces:**
- Produces: `GET /posts` 응답의 각 item에 `summary: str` 포함
- Produces: `service.make_summary(content: str) -> str` — router에서 호출 가능

---

- [ ] **Step 1: 브랜치 생성**

```bash
git checkout develop
git checkout -b home-feed
git checkout -b task-1
```

- [ ] **Step 2: PLAN.md 작성 후 커밋 (CLAUDE.md 규칙)**

`work_board_backend/PLAN.md` (또는 작업 루트) 에 아래 내용으로 파일 생성:

```markdown
---
DEV: DEV-001
task: task-1
title: 백엔드 PostListItem summary 필드 추가
status: in-progress
created: 2026-07-08
---

# task-1: 백엔드 PostListItem summary 필드 추가

## 배경
메인화면 피드에 게시글 요약을 표시하기 위해 목록 API 응답에 summary 필드가 필요.
DB 컬럼 추가 없이 content에서 마크다운 제거 후 앞 150자를 런타임 계산.

## 아키텍처
service.py에 make_summary() 헬퍼 추가 → router.py에서 PostListItem 생성 시 호출.

## 구현 범위
### 1. schema.py — PostListItem에 summary: str 추가
### 2. service.py — make_summary(content) 함수 추가
### 3. router.py — model_validate(p) → 명시적 생성으로 변경

## 검증
curl http://localhost:8000/posts?page=1&size=12 | python3 -m json.tool | grep summary
```

```bash
git add PLAN.md
git commit -m "plan. task-1 계획서 작성"
```

- [ ] **Step 3: `schema.py` 수정 — `summary` 필드 추가**

`work_board_backend/app/api/posts/schema.py` 의 `PostListItem`을 아래로 교체:

```python
class PostListItem(BaseModel):
    id: int
    title: str
    thumbnail_url: Optional[str]
    created_at: datetime
    summary: str

    class Config:
        from_attributes = True
```

- [ ] **Step 4: `service.py` 수정 — `make_summary` 함수 추가**

`work_board_backend/app/api/posts/service.py` 상단에 `import re` 추가 후, 파일 맨 위 (기존 import 바로 아래)에 함수 추가:

```python
import re
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.models import Post


def make_summary(content: str, max_len: int = 150) -> str:
    text = re.sub(r'!\[.*?\]\(.*?\)', '', content)
    text = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', text)
    text = re.sub(r'#{1,6}\s*', '', text)
    text = re.sub(r'[*_`~]{1,3}', '', text)
    text = re.sub(r'^\s*[-*+>]\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\d+\.\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:max_len] + ('...' if len(text) > max_len else '')
```

- [ ] **Step 5: `make_summary` 동작 빠르게 검증**

```bash
cd work_board_backend
python3 -c "
import re, sys
sys.path.insert(0, '.')
from app.api.posts.service import make_summary
assert make_summary('# 제목\n\n**굵게** 텍스트') == '제목 굵게 텍스트', 'markdown 미제거'
assert make_summary('a' * 200).endswith('...'), '150자 초과 말줄임 실패'
assert make_summary('') == '', '빈 문자열 실패'
print('OK')
"
```

Expected output: `OK`

- [ ] **Step 6: `router.py` 수정 — `PostListItem` 명시적 생성으로 변경**

`list_posts` 엔드포인트의 return 문을 아래로 교체:

```python
@router.get("", response_model=PostListResponse)
async def list_posts(
    page: int = Query(1, ge=1),
    size: int = Query(12, ge=1, le=50),
    db: AsyncSession = Depends(get_database_session),
):
    items, total = await service.get_posts(db, page, size)
    return PostListResponse(
        items=[
            PostListItem(
                id=p.id,
                title=p.title,
                thumbnail_url=p.thumbnail_url,
                created_at=p.created_at,
                summary=service.make_summary(p.content),
            )
            for p in items
        ],
        total=total,
        page=page,
        size=size,
    )
```

- [ ] **Step 7: 백엔드 서버 기동 후 API 응답 확인**

```bash
cd work_board_backend
uvicorn app.main:app --reload
```

새 터미널에서:

```bash
curl -s "http://localhost:8000/posts?page=1&size=12" | python3 -m json.tool | grep -A1 '"summary"'
```

Expected: 각 item에 `"summary": "..."` 필드가 포함된 JSON 응답.

- [ ] **Step 8: task-1 커밋 후 home-feed로 merge**

```bash
git add work_board_backend/app/api/posts/schema.py \
        work_board_backend/app/api/posts/service.py \
        work_board_backend/app/api/posts/router.py
git commit -m "feat. PostListItem에 summary 필드 추가"

git checkout home-feed
git merge --no-ff task-1
```

---

### Task 2: 프론트엔드 PostCard — summary 표시

**Files:**
- Modify: `work_board_frontend/src/components/PostCard.jsx`

**Interfaces:**
- Consumes: `post.summary: string` (Task 1에서 API 응답에 추가됨)
- Produces: PostCard 컴포넌트가 summary를 2줄 clamp으로 렌더링

---

- [ ] **Step 1: 브랜치 생성**

```bash
git checkout home-feed
git checkout -b task-2
```

- [ ] **Step 2: PLAN.md 작성 후 커밋**

프로젝트 루트 또는 관련 디렉토리에 `PLAN.md`:

```markdown
---
DEV: DEV-001
task: task-2
title: PostCard에 summary 표시
status: in-progress
created: 2026-07-08
---

# task-2: PostCard에 summary 표시

## 배경
Task 1에서 API 응답에 summary 필드가 추가됨. PostCard 카드 UI에 반영 필요.

## 구현 범위
PostCard.jsx — title과 날짜 사이에 summary 2줄 clamp 추가

## 검증
브라우저에서 메인화면 카드에 요약 텍스트가 2줄로 표시되는지 확인.
```

```bash
git add PLAN.md
git commit -m "plan. task-2 계획서 작성"
```

- [ ] **Step 3: `PostCard.jsx` 수정**

`work_board_frontend/src/components/PostCard.jsx` 전체를 아래로 교체:

```jsx
import { Link } from 'react-router-dom'

export default function PostCard({ post }) {
  const formattedDate = new Date(post.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Link
      to={`/posts/${post.id}`}
      className="flex flex-col overflow-hidden rounded-lg border border-[#D0D7DE] bg-white hover:border-[#0969DA] transition-colors"
    >
      {post.thumbnail_url ? (
        <img
          src={post.thumbnail_url}
          alt={post.title}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="h-40 w-full bg-[#F6F8FA]" />
      )}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-sm font-semibold text-[#1F2328] line-clamp-2 leading-snug">
          {post.title}
        </h3>
        {post.summary && (
          <p className="text-xs text-[#636C76] line-clamp-2 leading-relaxed">
            {post.summary}
          </p>
        )}
        <p className="mt-auto text-xs text-[#636C76]">{formattedDate}</p>
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: 브라우저에서 확인**

```bash
cd work_board_frontend
npm run dev
```

브라우저에서 `http://localhost:5173` 접속 → 카드마다 제목 아래 요약 텍스트가 2줄로 표시되는지 확인.

- [ ] **Step 5: task-2 커밋 후 home-feed로 merge**

```bash
git add work_board_frontend/src/components/PostCard.jsx
git commit -m "feat. PostCard에 summary 표시 추가"

git checkout home-feed
git merge --no-ff task-2
```

---

### Task 3: 프론트엔드 Home — 무한 스크롤

**Files:**
- Modify: `work_board_frontend/src/pages/Home.jsx`

**Interfaces:**
- Consumes: `GET /posts?page={n}&size=12` — `{ items: PostListItem[], total: number, page: number, size: number }`
- Consumes: PostCard 컴포넌트 (Task 2 완료 후)

---

- [ ] **Step 1: 브랜치 생성**

```bash
git checkout home-feed
git checkout -b task-3
```

- [ ] **Step 2: PLAN.md 작성 후 커밋**

```markdown
---
DEV: DEV-001
task: task-3
title: Home 무한 스크롤 구현
status: in-progress
created: 2026-07-08
---

# task-3: Home 무한 스크롤 구현

## 배경
메인화면을 공개 피드로 전환. IntersectionObserver로 sentinel div 감지 시 다음 페이지 fetch.
stateRef 패턴으로 observer 콜백의 stale closure 문제 방지.

## 구현 범위
Home.jsx 전체 교체 — 상태 관리, IntersectionObserver 설정, 렌더링

## 검증
스크롤 내릴 때 추가 게시글 로드, 마지막 페이지에서 "모든 글을 불러왔습니다" 표시.
```

```bash
git add PLAN.md
git commit -m "plan. task-3 계획서 작성"
```

- [ ] **Step 3: `Home.jsx` 전체 교체**

`work_board_frontend/src/pages/Home.jsx` 를 아래 코드로 교체:

```jsx
import { useEffect, useRef, useState } from 'react'
import api from '../services/api'
import PostCard from '../components/PostCard'

const SIZE = 12

export default function Home() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState(null)
  const sentinelRef = useRef(null)
  const stateRef = useRef({ page: 1, loading: false, hasMore: true })

  const fetchNext = async () => {
    const { page, loading, hasMore } = stateRef.current
    if (loading || !hasMore) return

    stateRef.current.loading = true
    setLoading(true)

    try {
      const { data } = await api.get(`/posts?page=${page}&size=${SIZE}`)
      const newHasMore = page * SIZE < data.total

      setPosts((prev) => (page === 1 ? data.items : [...prev, ...data.items]))
      setHasMore(newHasMore)

      stateRef.current.page = page + 1
      stateRef.current.hasMore = newHasMore
    } catch {
      setError('글을 불러오지 못했습니다.')
    } finally {
      stateRef.current.loading = false
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNext()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchNext()
      },
      { threshold: 0.1 },
    )
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#1F2328]">최근 글</h2>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!loading && !error && posts.length === 0 && (
          <p className="text-sm text-[#636C76]">아직 작성된 글이 없습니다.</p>
        )}
        {posts.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
        {loading && (
          <p className="mt-6 text-center text-sm text-[#636C76]">불러오는 중...</p>
        )}
        {!hasMore && posts.length > 0 && (
          <p className="mt-6 text-center text-sm text-[#636C76]">
            모든 글을 불러왔습니다.
          </p>
        )}
        <div ref={sentinelRef} className="h-1" />
      </section>
    </main>
  )
}
```

- [ ] **Step 4: 브라우저에서 무한 스크롤 검증**

```bash
cd work_board_frontend
npm run dev
```

브라우저 `http://localhost:5173` 에서 확인할 항목:
1. 페이지 진입 시 게시글 12개 로드
2. 스크롤을 맨 아래로 내리면 "불러오는 중..." 표시 후 추가 게시글 append
3. 전체 게시글을 모두 로드했을 때 "모든 글을 불러왔습니다." 표시
4. "안녕하세요" 관련 코드가 화면에 없음
5. 게시글이 없을 때 "아직 작성된 글이 없습니다." 표시

- [ ] **Step 5: task-3 커밋 후 home-feed → develop merge**

```bash
git add work_board_frontend/src/pages/Home.jsx
git commit -m "feat. Home 무한 스크롤 구현"

git checkout home-feed
git merge --no-ff task-3

git checkout develop
git merge --no-ff home-feed
```
