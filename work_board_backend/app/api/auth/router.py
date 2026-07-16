from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Cookie, Query, Response, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_database_session
from app.core.models import User
from app.core.redis_client import get_redis
from app.core.security import create_access_token, create_refresh_token, decode_token, decode_access_token
from app.api.auth.schema import SignupRequest, LoginRequest, TokenResponse, UserResponse
from app.api.auth import service

router = APIRouter()

_bearer = HTTPBearer()
_bearer_optional = HTTPBearer(auto_error=False)

REFRESH_COOKIE = "refresh_token"
COOKIE_MAX_AGE = 7 * 24 * 3600


async def get_current_user(
    credentials=Depends(_bearer),
    db: AsyncSession = Depends(get_database_session),
) -> User:
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰")
    user = await service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="유저 없음")
    return user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_optional),
    db: AsyncSession = Depends(get_database_session),
) -> Optional[User]:
    if not credentials:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
        return await service.get_user_by_id(db, int(payload["sub"]))
    except Exception:
        return None


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE, value=token,
        httponly=True, secure=True, max_age=COOKIE_MAX_AGE, samesite="lax",
    )


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    body: SignupRequest,
    response: Response,
    db: AsyncSession = Depends(get_database_session),
    redis=Depends(get_redis),
):
    try:
        user = await service.create_user(db, body.email, body.password, body.nickname)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    await service.save_refresh_token(redis, user.id, refresh_token)
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(access_token=access_token)


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_database_session),
    redis=Depends(get_redis),
):
    user = await service.authenticate_user(db, body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다")
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    await service.save_refresh_token(redis, user.id, refresh_token)
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(access_token=access_token)


@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: Optional[str] = Cookie(default=None, alias=REFRESH_COOKIE),
    redis=Depends(get_redis),
):
    if refresh_token:
        try:
            payload = decode_token(refresh_token)
            await service.delete_refresh_token(redis, int(payload["sub"]))
        except Exception:
            pass
    response.delete_cookie(REFRESH_COOKIE)
    return {"message": "로그아웃 완료"}


@router.get("/check-email")
async def check_email(
    email: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_database_session),
):
    return {"available": await service.check_email_available(db, email)}


@router.get("/check-nickname")
async def check_nickname(
    nickname: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_database_session),
):
    return {"available": await service.check_nickname_available(db, nickname)}


@router.get("/owner")
async def owner(db: AsyncSession = Depends(get_database_session)):
    result = await db.execute(select(User).order_by(User.id).limit(1))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="사용자 없음")
    return {"id": user.id, "nickname": user.nickname, "profile_image_url": user.profile_image_url}


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        nickname=current_user.nickname,
        profile_image_url=current_user.profile_image_url,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    refresh_token: Optional[str] = Cookie(default=None, alias=REFRESH_COOKIE),
    db: AsyncSession = Depends(get_database_session),
    redis=Depends(get_redis),
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token 없음")
    try:
        payload = decode_token(refresh_token)
        user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰")
    if not await service.verify_refresh_token(redis, user_id, refresh_token):
        raise HTTPException(status_code=401, detail="만료되거나 유효하지 않은 Refresh token")
    user = await service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="유저 없음")
    new_access = create_access_token({"sub": str(user.id)})
    new_refresh = create_refresh_token({"sub": str(user.id)})
    await service.save_refresh_token(redis, user.id, new_refresh)
    _set_refresh_cookie(response, new_refresh)
    return TokenResponse(access_token=new_access)
