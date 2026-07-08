from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_database_session
from app.api.auth.router import get_current_user
from app.api.posts.schema import (
    PostCreate, PostUpdate, PostResponse, PostListResponse, PostListItem,
    LikeResponse, CommentCreate, CommentResponse,
)
from app.api.posts import service

router = APIRouter()


@router.get("", response_model=PostListResponse)
async def list_posts(
    page: int = Query(1, ge=1),
    size: int = Query(12, ge=1, le=50),
    db: AsyncSession = Depends(get_database_session),
):
    items, total = await service.get_posts(db, page, size)
    return PostListResponse(
        items=[PostListItem(**item) for item in items],
        total=total,
        page=page,
        size=size,
    )


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    body: PostCreate,
    db: AsyncSession = Depends(get_database_session),
    current_user=Depends(get_current_user),
):
    post = await service.create_post(
        db, current_user.id, body.title, body.content, body.thumbnail_url, body.is_published
    )
    return PostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        thumbnail_url=post.thumbnail_url,
        is_published=post.is_published,
        created_at=post.created_at,
        updated_at=post.updated_at,
        author_nickname=current_user.nickname,
    )


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    db: AsyncSession = Depends(get_database_session),
):
    if post_id <= 0:
        raise HTTPException(status_code=400, detail="유효하지 않은 게시글 ID입니다.")
    result = await service.get_post(db, post_id)
    if not result:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다.")
    post, nickname = result
    return PostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        thumbnail_url=post.thumbnail_url,
        is_published=post.is_published,
        created_at=post.created_at,
        updated_at=post.updated_at,
        author_nickname=nickname,
    )


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    body: PostUpdate,
    db: AsyncSession = Depends(get_database_session),
    current_user=Depends(get_current_user),
):
    if post_id <= 0:
        raise HTTPException(status_code=400, detail="유효하지 않은 게시글 ID입니다.")
    result = await service.get_post(db, post_id)
    if not result:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다.")
    post, nickname = result
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다.")
    updated = await service.update_post(
        db, post,
        title=body.title,
        content=body.content,
        thumbnail_url=body.thumbnail_url,
        is_published=body.is_published,
    )
    return PostResponse(
        id=updated.id, title=updated.title, content=updated.content,
        thumbnail_url=updated.thumbnail_url, is_published=updated.is_published,
        created_at=updated.created_at, updated_at=updated.updated_at,
        author_nickname=nickname,
    )


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    db: AsyncSession = Depends(get_database_session),
    current_user=Depends(get_current_user),
):
    if post_id <= 0:
        raise HTTPException(status_code=400, detail="유효하지 않은 게시글 ID입니다.")
    result = await service.get_post(db, post_id)
    if not result:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다.")
    post, _ = result
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    await service.delete_post(db, post_id)


# ── 좋아요 ──────────────────────────────────────────────────────────

@router.post("/{post_id}/like", response_model=LikeResponse)
async def toggle_like(
    post_id: int,
    db: AsyncSession = Depends(get_database_session),
    current_user=Depends(get_current_user),
):
    result = await service.get_post(db, post_id)
    if not result:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다.")
    count, liked = await service.toggle_like(db, post_id, current_user.id)
    return LikeResponse(count=count, liked=liked)


@router.get("/{post_id}/like", response_model=LikeResponse)
async def get_like_status(
    post_id: int,
    request: Request,
    db: AsyncSession = Depends(get_database_session),
):
    result = await service.get_post(db, post_id)
    if not result:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다.")
    # 토큰 있으면 내 좋아요 여부도 반환
    user_id = None
    auth = request.headers.get("authorization", "")
    if auth.startswith("Bearer "):
        from app.core.security import decode_token
        try:
            payload = decode_token(auth.split(" ")[1])
            user_id = int(payload["sub"])
        except Exception:
            pass
    count, liked = await service.get_like_status(db, post_id, user_id)
    return LikeResponse(count=count, liked=liked)


# ── 댓글 ──────────────────────────────────────────────────────────

@router.get("/{post_id}/comments", response_model=list[CommentResponse])
async def list_comments(
    post_id: int,
    db: AsyncSession = Depends(get_database_session),
):
    result = await service.get_post(db, post_id)
    if not result:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다.")
    return await service.get_comments(db, post_id)


@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    post_id: int,
    body: CommentCreate,
    db: AsyncSession = Depends(get_database_session),
    current_user=Depends(get_current_user),
):
    result = await service.get_post(db, post_id)
    if not result:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다.")
    comment = await service.create_comment(db, post_id, current_user.id, body.content, body.parent_id)
    return CommentResponse(
        id=comment.id,
        author_nickname=current_user.nickname,
        content=comment.content,
        created_at=comment.created_at,
        parent_id=comment.parent_id,
        replies=[],
    )


@router.delete("/{post_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    post_id: int,
    comment_id: int,
    db: AsyncSession = Depends(get_database_session),
    current_user=Depends(get_current_user),
):
    from app.core.models import Comment
    from sqlalchemy import select
    result = await db.execute(
        select(Comment).where(Comment.id == comment_id, Comment.post_id == post_id)
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    await service.delete_comment(db, comment_id)
