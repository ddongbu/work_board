from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PostCreate(BaseModel):
    title: str
    content: str
    thumbnail_url: Optional[str] = None
    is_published: bool = True


class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    thumbnail_url: Optional[str]
    is_published: bool
    created_at: datetime
    updated_at: datetime
    author_nickname: str

    class Config:
        from_attributes = True


class PostListItem(BaseModel):
    id: int
    title: str
    thumbnail_url: Optional[str]
    created_at: datetime
    summary: str
    author_nickname: str

    class Config:
        from_attributes = True


class PostListResponse(BaseModel):
    items: list[PostListItem]
    total: int
    page: int
    size: int
