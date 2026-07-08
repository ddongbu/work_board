import re
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.models import Post, User


def make_summary(content: str, max_len: int = 150) -> str:
    if not content:
        return ''
    text = re.sub(r'!\[.*?\]\(.*?\)', '', content)
    text = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', text)
    text = re.sub(r'^#{1,6}\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'[*_`~]{1,3}', '', text)
    text = re.sub(r'^\s*[-*+>]\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\d+\.\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:max_len] + ('...' if len(text) > max_len else '')


def _to_list_item(post: Post, nickname: str) -> dict:
    return {
        'id': post.id,
        'title': post.title,
        'thumbnail_url': post.thumbnail_url,
        'created_at': post.created_at,
        'summary': make_summary(post.content),
        'author_nickname': nickname,
    }


async def get_posts(db: AsyncSession, page: int, size: int):
    offset = (page - 1) * size
    result = await db.execute(
        select(Post, User.nickname)
        .join(User, Post.user_id == User.id)
        .where(Post.is_published == True)
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(size)
    )
    rows = result.all()
    count_result = await db.execute(
        select(func.count()).select_from(Post).where(Post.is_published == True)
    )
    total = count_result.scalar()
    items = [_to_list_item(post, nickname) for post, nickname in rows]
    return items, total


async def get_post(db: AsyncSession, post_id: int):
    result = await db.execute(
        select(Post, User.nickname)
        .join(User, Post.user_id == User.id)
        .where(Post.id == post_id)
    )
    row = result.one_or_none()
    if not row:
        return None
    post, nickname = row
    return post, nickname


async def create_post(db: AsyncSession, user_id: int, title: str, content: str,
                      thumbnail_url: str | None, is_published: bool) -> Post:
    post = Post(user_id=user_id, title=title, content=content,
                thumbnail_url=thumbnail_url, is_published=is_published)
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post


async def delete_post(db: AsyncSession, post_id: int) -> bool:
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        return False
    await db.delete(post)
    await db.commit()
    return True
