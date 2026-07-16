from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_database_session
from app.api.auth.router import get_current_user, get_optional_user
from app.api.posts.schema import (
    PostCreate, PostUpdate, PostResponse, PostListResponse, PostListItem,
    LikeResponse, CommentCreate, CommentResponse, CommentUpdate, CommentUpdateResponse,
)
from app.api.posts import service

router = APIRouter()


def _post_response(post, nickname: str) -> PostResponse:
    return PostResponse(
        id=post.id, title=post.title, content=post.content,
        thumbnail_url=post.thumbnail_url, is_published=post.is_published,
        created_at=post.created_at, updated_at=post.updated_at,
        author_nickname=nickname,
    )


async def _get_post_or_404(db: AsyncSession, post_id: int):
    result = await service.get_post(db, post_id)
    if not result:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다.")
    return result


# ── Posts ────────────────────────────────────────────────────────────


@router.get("", response_model=PostListResponse)
async def list_posts(
    page: int = Query(1, ge=1),
    size: int = Query(12, ge=1, le=50),
    db: AsyncSession = Depends(get_database_session),
):
    items, total = await service.get_posts(db, page, size)
    return PostListResponse(
        items=[PostListItem(**item) for item in items],
        total=total, page=page, size=size,
    )


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    body: PostCreate,
    db: AsyncSession = Depends(get_database_session),
    current_user=Depends(get_current_user),
):
    post = await service.create_post(
        db, current_user.id, body.title, body.content, body.thumbnail_url, body.is_published,
    )
    return _post_response(post, current_user.nickname)


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    db: AsyncSession = Depends(get_database_session),
):
    post, nickname = await _get_post_or_404(db, post_id)
    return _post_response(post, nickname)


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    body: PostUpdate,
    db: AsyncSession = Depends(get_database_session),
    current_user=Depends(get_current_user),
):
    post, nickname = await _get_post_or_404(db, post_id)
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다.")
    updated = await service.update_post(
        db, post, title=body.title, content=body.content,
        thumbnail_url=body.thumbnail_url, is_published=body.is_published,
    )
    return _post_response(updated, nickname)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    db: AsyncSession = Depends(get_database_session),
    current_user=Depends(get_current_user),
):
    post, _ = await _get_post_or_404(db, post_id)
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    await service.delete_post(db, post)


# ── Likes ────────────────────────────────────────────────────────────


@router.post("/{post_id}/like", response_model=LikeResponse)
async def toggle_like(
    post_id: int,
    db: AsyncSession = Depends(get_database_session),
    current_user=Depends(get_current_user),
):
    await _get_post_or_404(db, post_id)
    count, liked = await service.toggle_like(db, post_id, current_user.id)
    return LikeResponse(count=count, liked=liked)


@router.get("/{post_id}/like", response_model=LikeResponse)
async def get_like_status(
    post_id: int,
    db: AsyncSession = Depends(get_database_session),
    current_user=Depends(get_optional_user),
):
    await _get_post_or_404(db, post_id)
    count, liked = await service.get_like_status(db, post_id, current_user.id if current_user else None)
    return LikeResponse(count=count, liked=liked)


# ── Comments ─────────────────────────────────────────────────────────


@router.get("/{post_id}/comments", response_model=list[CommentResponse])
async def list_comments(
    post_id: int,
    db: AsyncSession = Depends(get_database_session),
):
    await _get_post_or_404(db, post_id)
    return await service.get_comments(db, post_id)


@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    post_id: int,
    body: CommentCreate,
    db: AsyncSession = Depends(get_database_session),
    current_user=Depends(get_current_user),
):
    await _get_post_or_404(db, post_id)
    comment = await service.create_comment(db, post_id, current_user.id, body.content, body.parent_id)
    return CommentResponse(
        id=comment.id, author_nickname=current_user.nickname,
        content=comment.content, created_at=comment.created_at,
        parent_id=comment.parent_id, replies=[],
    )


@router.put("/{post_id}/comments/{comment_id}", response_model=CommentUpdateResponse)
async def update_comment(
    post_id: int,
    comment_id: int,
    body: CommentUpdate,
    db: AsyncSession = Depends(get_database_session),
    current_user=Depends(get_current_user),
):
    await _get_post_or_404(db, post_id)
    comment = await service.get_comment(db, comment_id, post_id)
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다.")
    updated = await service.update_comment(db, comment, body.content)
    return CommentUpdateResponse(id=updated.id, content=updated.content, updated_at=updated.updated_at)


@router.delete("/{post_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    post_id: int,
    comment_id: int,
    db: AsyncSession = Depends(get_database_session),
    current_user=Depends(get_current_user),
):
    comment = await service.get_comment(db, comment_id, post_id)
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")
    await service.delete_comment(db, comment)
