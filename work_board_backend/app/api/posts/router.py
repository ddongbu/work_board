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


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    body: PostCreate,
    db: AsyncSession = Depends(get_database_session),
    current_user=Depends(get_current_user),
):
    post = await service.create_post(
        db, body.title, body.content, body.thumbnail_url, body.is_published
    )
    return PostResponse.model_validate(post)


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    db: AsyncSession = Depends(get_database_session),
):
    post = await service.get_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다")
    return PostResponse.model_validate(post)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    db: AsyncSession = Depends(get_database_session),
    current_user=Depends(get_current_user),
):
    deleted = await service.delete_post(db, post_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="글을 찾을 수 없습니다")
