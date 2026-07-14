from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from passlib.context import CryptContext

from app.core.models import User, UserPassword

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def update_profile(
    db: AsyncSession,
    user: User,
    nickname: str,
    profile_image_url: str | None,
) -> User:
    user.nickname = nickname
    user.profile_image_url = profile_image_url
    await db.commit()
    await db.refresh(user)
    return user


async def change_password(
    db: AsyncSession,
    user: User,
    current_password: str,
    new_password: str,
) -> bool:
    result = await db.execute(
        select(UserPassword)
        .where(UserPassword.user_id == user.id, UserPassword.is_active == True)
        .order_by(UserPassword.id.desc())
        .limit(1)
    )
    user_pw = result.scalar_one_or_none()
    if not user_pw or not pwd_context.verify(current_password, user_pw.password_hash):
        return False

    user_pw.is_active = False
    new_pw = UserPassword(
        user_id=user.id,
        password_hash=pwd_context.hash(new_password),
        is_active=True,
    )
    db.add(new_pw)
    await db.commit()
    return True


async def delete_account(db: AsyncSession, user: User) -> None:
    # UserPassword에 ON DELETE CASCADE 없으므로 먼저 수동 삭제
    await db.execute(delete(UserPassword).where(UserPassword.user_id == user.id))
    await db.delete(user)
    await db.commit()
