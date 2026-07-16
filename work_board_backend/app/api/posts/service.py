import re
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.models import Post, User, PostLike, Comment


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


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ── Posts ────────────────────────────────────────────────────────────


async def get_posts(db: AsyncSession, page: int, size: int) -> tuple[list[dict], int]:
    offset = (page - 1) * size

    like_counts = (
        select(PostLike.post_id, func.count().label('cnt'))
        .group_by(PostLike.post_id)
        .subquery()
    )
    comment_counts = (
        select(Comment.post_id, func.count().label('cnt'))
        .where(Comment.parent_id.is_(None))
        .group_by(Comment.post_id)
        .subquery()
    )

    rows = (await db.execute(
        select(Post, User.nickname, User.profile_image_url,
               func.coalesce(like_counts.c.cnt, 0).label('like_count'),
               func.coalesce(comment_counts.c.cnt, 0).label('comment_count'))
        .join(User, Post.user_id == User.id)
        .outerjoin(like_counts, Post.id == like_counts.c.post_id)
        .outerjoin(comment_counts, Post.id == comment_counts.c.post_id)
        .where(Post.is_published.is_(True))
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(size)
    )).all()

    total = (await db.execute(
        select(func.count()).select_from(Post).where(Post.is_published.is_(True))
    )).scalar()

    items = [
        {
            'id': post.id,
            'title': post.title,
            'thumbnail_url': post.thumbnail_url,
            'created_at': post.created_at,
            'summary': make_summary(post.content),
            'author_nickname': nickname,
            'author_profile_image_url': profile_image_url,
            'like_count': int(like_count),
            'comment_count': int(comment_count),
        }
        for post, nickname, profile_image_url, like_count, comment_count in rows
    ]
    return items, total


async def get_post(db: AsyncSession, post_id: int) -> Optional[tuple[Post, str]]:
    row = (await db.execute(
        select(Post, User.nickname)
        .join(User, Post.user_id == User.id)
        .where(Post.id == post_id)
    )).one_or_none()
    return row  # (Post, nickname) or None


async def create_post(
    db: AsyncSession, user_id: int, title: str, content: str,
    thumbnail_url: Optional[str], is_published: bool,
) -> Post:
    post = Post(user_id=user_id, title=title, content=content,
                thumbnail_url=thumbnail_url, is_published=is_published)
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post


async def update_post(db: AsyncSession, post: Post, **fields) -> Post:
    for key, val in fields.items():
        if val is not None:
            setattr(post, key, val)
    post.updated_at = _now()
    await db.commit()
    await db.refresh(post)
    return post


async def delete_post(db: AsyncSession, post: Post) -> None:
    await db.delete(post)
    await db.commit()


# ── Likes ────────────────────────────────────────────────────────────


async def toggle_like(db: AsyncSession, post_id: int, user_id: int) -> tuple[int, bool]:
    like = (await db.execute(
        select(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == user_id)
    )).scalar_one_or_none()

    if like:
        await db.delete(like)
        liked = False
    else:
        db.add(PostLike(post_id=post_id, user_id=user_id))
        liked = True
    await db.commit()

    count = (await db.execute(
        select(func.count()).select_from(PostLike).where(PostLike.post_id == post_id)
    )).scalar()
    return count, liked


async def get_like_status(db: AsyncSession, post_id: int, user_id: Optional[int]) -> tuple[int, bool]:
    count = (await db.execute(
        select(func.count()).select_from(PostLike).where(PostLike.post_id == post_id)
    )).scalar()

    if user_id is None:
        return count, False

    liked = (await db.execute(
        select(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == user_id)
    )).scalar_one_or_none() is not None
    return count, liked


# ── Comments ─────────────────────────────────────────────────────────


async def get_comment(db: AsyncSession, comment_id: int, post_id: int) -> Optional[Comment]:
    return (await db.execute(
        select(Comment).where(Comment.id == comment_id, Comment.post_id == post_id)
    )).scalar_one_or_none()


async def get_comments(db: AsyncSession, post_id: int) -> list[dict]:
    top_level = (await db.execute(
        select(Comment, User.nickname)
        .join(User, Comment.user_id == User.id)
        .where(Comment.post_id == post_id, Comment.parent_id.is_(None))
        .order_by(Comment.created_at.asc())
    )).all()

    replies_raw = (await db.execute(
        select(Comment, User.nickname)
        .join(User, Comment.user_id == User.id)
        .where(Comment.post_id == post_id, Comment.parent_id.is_not(None))
        .order_by(Comment.created_at.asc())
    )).all()

    reply_map: dict[int, list] = {}
    for comment, nickname in replies_raw:
        reply_map.setdefault(comment.parent_id, []).append({
            'id': comment.id,
            'author_nickname': nickname,
            'content': comment.content,
            'created_at': comment.created_at,
            'parent_id': comment.parent_id,
            'replies': [],
        })

    return [
        {
            'id': comment.id,
            'author_nickname': nickname,
            'content': comment.content,
            'created_at': comment.created_at,
            'parent_id': None,
            'replies': reply_map.get(comment.id, []),
        }
        for comment, nickname in top_level
    ]


async def create_comment(
    db: AsyncSession, post_id: int, user_id: int,
    content: str, parent_id: Optional[int],
) -> Comment:
    comment = Comment(post_id=post_id, user_id=user_id, content=content, parent_id=parent_id)
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment


async def update_comment(db: AsyncSession, comment: Comment, content: str) -> Comment:
    comment.content = content
    comment.updated_at = _now()
    await db.commit()
    await db.refresh(comment)
    return comment


async def delete_comment(db: AsyncSession, comment: Comment) -> None:
    await db.delete(comment)
    await db.commit()
