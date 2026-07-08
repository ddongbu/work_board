from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_database_session
from app.api.auth.router import get_current_user
from app.api.posts.schema import PostCreate, PostResponse, PostListResponse, PostListItem
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
