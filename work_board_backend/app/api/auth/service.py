from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.core.models import User, UserPassword
from app.core.security import hash_password, verify_password
from app.core.config import settings


async def create_user(db: AsyncSession, email: str, password: str, nickname: str) -> User:
    user = User(email=email, nickname=nickname)
    db.add(user)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="이미 사용 중인 이메일입니다.")
    user_pw = UserPassword(user_id=user.id, password_hash=hash_password(password))
    db.add(user_pw)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return None
    pw_result = await db.execute(
        select(UserPassword)
        .where(UserPassword.user_id == user.id, UserPassword.is_active == True)
        .order_by(UserPassword.id.desc())
        .limit(1)
    )
    user_pw = pw_result.scalar_one_or_none()
    if not user_pw or not verify_password(password, user_pw.password_hash):
        return None
    return user


async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def save_refresh_token(redis: Redis, user_id: int, token: str) -> None:
    expire = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    await redis.set(f"refresh:{user_id}", token, ex=expire)


async def verify_refresh_token(redis: Redis, user_id: int, token: str) -> bool:
    stored = await redis.get(f"refresh:{user_id}")
    return stored == token


async def delete_refresh_token(redis: Redis, user_id: int) -> None:
    await redis.delete(f"refresh:{user_id}")
