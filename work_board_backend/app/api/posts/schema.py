import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator, ConfigDict

_URL_RE = re.compile(r'^https?://')


def _validate_thumbnail_url(v: Optional[str]) -> Optional[str]:
    if not v:
        return None
    v = v.strip()
    if not v:
        return None
    if not _URL_RE.match(v):
        raise ValueError('썸네일 URL 형식이 올바르지 않습니다.')
    if len(v) > 1000:
        raise ValueError('썸네일 URL이 너무 깁니다.')
    return v


def _validate_comment_content(v: str) -> str:
    v = v.strip()
    if not v:
        raise ValueError('댓글을 입력해주세요.')
    if len(v) > 1000:
        raise ValueError('댓글은 1000자 이하여야 합니다.')
    return v


class PostCreate(BaseModel):
    title: str
    content: str
    thumbnail_url: Optional[str] = None
    is_published: bool = True

    @field_validator('title')
    @classmethod
    def title_validate(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError('제목을 입력해주세요.')
        if len(v) > 500:
            raise ValueError('제목은 500자 이하여야 합니다.')
        return v

    @field_validator('content')
    @classmethod
    def content_validate(cls, v: str) -> str:
        if not v.strip():
            raise ValueError('내용을 입력해주세요.')
        if len(v) > 200_000:
            raise ValueError('내용이 너무 깁니다. (최대 200,000자)')
        return v

    @field_validator('thumbnail_url')
    @classmethod
    def thumbnail_url_validate(cls, v: Optional[str]) -> Optional[str]:
        return _validate_thumbnail_url(v)


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_published: Optional[bool] = None

    @field_validator('title')
    @classmethod
    def title_validate(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError('제목을 입력해주세요.')
        if len(v) > 500:
            raise ValueError('제목은 500자 이하여야 합니다.')
        return v

    @field_validator('content')
    @classmethod
    def content_validate(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not v.strip():
            raise ValueError('내용을 입력해주세요.')
        if len(v) > 200_000:
            raise ValueError('내용이 너무 깁니다.')
        return v

    @field_validator('thumbnail_url')
    @classmethod
    def thumbnail_url_validate(cls, v: Optional[str]) -> Optional[str]:
        return _validate_thumbnail_url(v)


class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    content: str
    thumbnail_url: Optional[str]
    is_published: bool
    created_at: datetime
    updated_at: datetime
    author_nickname: str


class PostListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    thumbnail_url: Optional[str]
    created_at: datetime
    summary: str
    author_nickname: str
    author_profile_image_url: Optional[str] = None
    like_count: int = 0
    comment_count: int = 0


class PostListResponse(BaseModel):
    items: list[PostListItem]
    total: int
    page: int
    size: int


class LikeResponse(BaseModel):
    count: int
    liked: bool


class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None

    @field_validator('content')
    @classmethod
    def content_validate(cls, v: str) -> str:
        return _validate_comment_content(v)


class CommentUpdate(BaseModel):
    content: str

    @field_validator('content')
    @classmethod
    def content_validate(cls, v: str) -> str:
        return _validate_comment_content(v)


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    author_nickname: str
    content: str
    created_at: datetime
    parent_id: Optional[int]
    replies: list['CommentResponse'] = []


class CommentUpdateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content: str
    updated_at: datetime
