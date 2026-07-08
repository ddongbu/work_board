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


async def get_posts(db: AsyncSession, page: int, size: int):
    offset = (page - 1) * size
    result = await db.execute(
        select(Post)
        .where(Post.is_published == True)
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(size)
    )
    items = result.scalars().all()
    count_result = await db.execute(
        select(func.count()).select_from(Post).where(Post.is_published == True)
    )
    total = count_result.scalar()
    return items, total


async def get_post(db: AsyncSession, post_id: int) -> Post | None:
    result = await db.execute(select(Post).where(Post.id == post_id))
    return result.scalar_one_or_none()


async def create_post(db: AsyncSession, title: str, content: str,
                      thumbnail_url: str | None, is_published: bool) -> Post:
    post = Post(title=title, content=content,
                thumbnail_url=thumbnail_url, is_published=is_published)
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post


async def delete_post(db: AsyncSession, post_id: int) -> bool:
    post = await get_post(db, post_id)
    if not post:
        return False
    await db.delete(post)
    await db.commit()
    return True
