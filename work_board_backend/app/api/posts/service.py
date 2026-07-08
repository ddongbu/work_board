import re
import datetime
from sqlalchemy import select, func, delete
from sqlalchemy.exc import IntegrityError
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


def _to_list_item(post: Post, nickname: str, like_count: int = 0, comment_count: int = 0) -> dict:
    return {
        'id': post.id,
        'title': post.title,
        'thumbnail_url': post.thumbnail_url,
        'created_at': post.created_at,
        'summary': make_summary(post.content),
        'author_nickname': nickname,
        'like_count': like_count,
        'comment_count': comment_count,
    }


async def get_posts(db: AsyncSession, page: int, size: int):
    offset = (page - 1) * size

    like_counts = (
        select(PostLike.post_id, func.count().label('cnt'))
        .group_by(PostLike.post_id)
        .subquery()
    )
    comment_counts = (
        select(Comment.post_id, func.count().label('cnt'))
        .where(Comment.parent_id == None)
        .group_by(Comment.post_id)
        .subquery()
    )

    result = await db.execute(
        select(
            Post, User.nickname,
            func.coalesce(like_counts.c.cnt, 0).label('like_count'),
            func.coalesce(comment_counts.c.cnt, 0).label('comment_count'),
        )
        .join(User, Post.user_id == User.id)
        .outerjoin(like_counts, Post.id == like_counts.c.post_id)
        .outerjoin(comment_counts, Post.id == comment_counts.c.post_id)
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
    items = [_to_list_item(post, nickname, int(like_count), int(comment_count)) for post, nickname, like_count, comment_count in rows]
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


async def update_post(db: AsyncSession, post: Post, **fields) -> Post:
    for key, val in fields.items():
        if val is not None:
            setattr(post, key, val)
    post.updated_at = datetime.datetime.utcnow()
    await db.commit()
    await db.refresh(post)
    return post


async def toggle_like(db: AsyncSession, post_id: int, user_id: int) -> tuple[int, bool]:
    existing = await db.execute(
        select(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == user_id)
    )
    like = existing.scalar_one_or_none()
    if like:
        await db.delete(like)
        await db.commit()
        liked = False
    else:
        db.add(PostLike(post_id=post_id, user_id=user_id))
        await db.commit()
        liked = True
    count_result = await db.execute(
        select(func.count()).select_from(PostLike).where(PostLike.post_id == post_id)
    )
    return count_result.scalar(), liked


async def get_like_status(db: AsyncSession, post_id: int, user_id: int | None) -> tuple[int, bool]:
    count_result = await db.execute(
        select(func.count()).select_from(PostLike).where(PostLike.post_id == post_id)
    )
    count = count_result.scalar()
    if user_id is None:
        return count, False
    existing = await db.execute(
        select(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == user_id)
    )
    return count, existing.scalar_one_or_none() is not None


async def get_comments(db: AsyncSession, post_id: int) -> list[dict]:
    result = await db.execute(
        select(Comment, User.nickname)
        .join(User, Comment.user_id == User.id)
        .where(Comment.post_id == post_id, Comment.parent_id == None)
        .order_by(Comment.created_at.asc())
    )
    top_level = result.all()

    reply_result = await db.execute(
        select(Comment, User.nickname)
        .join(User, Comment.user_id == User.id)
        .where(Comment.post_id == post_id, Comment.parent_id != None)
        .order_by(Comment.created_at.asc())
    )
    replies_raw = reply_result.all()

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

    comments = []
    for comment, nickname in top_level:
        comments.append({
            'id': comment.id,
            'author_nickname': nickname,
            'content': comment.content,
            'created_at': comment.created_at,
            'parent_id': None,
            'replies': reply_map.get(comment.id, []),
        })
    return comments


async def create_comment(db: AsyncSession, post_id: int, user_id: int,
                         content: str, parent_id: int | None) -> Comment:
    comment = Comment(post_id=post_id, user_id=user_id, content=content, parent_id=parent_id)
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment


async def delete_comment(db: AsyncSession, comment_id: int) -> None:
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if comment:
        await db.delete(comment)
        await db.commit()
