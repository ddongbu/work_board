from fastapi import APIRouter, Depends, HTTPException, Cookie, Query, Response, status
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_database_session
from app.core.redis_client import get_redis
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.api.auth.schema import SignupRequest, LoginRequest, TokenResponse, UserResponse
from app.api.auth import service

router = APIRouter()
security_scheme = HTTPBearer()

REFRESH_COOKIE = "refresh_token"
COOKIE_MAX_AGE = 7 * 24 * 3600


async def get_current_user(
    credentials=Depends(security_scheme),
    db: AsyncSession = Depends(get_database_session),
):
    try:
        payload = decode_token(credentials.credentials)
        user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰")
    user = await service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="유저 없음")
    return user


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    body: SignupRequest,
    response: Response,
    db: AsyncSession = Depends(get_database_session),
    redis=Depends(get_redis),
):
    user = await service.create_user(db, body.email, body.password, body.nickname)
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    await service.save_refresh_token(redis, user.id, refresh_token)
    response.set_cookie(
        key=REFRESH_COOKIE, value=refresh_token,
        httponly=True, max_age=COOKIE_MAX_AGE, samesite="lax"
    )
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
    response.set_cookie(
        key=REFRESH_COOKIE, value=refresh_token,
        httponly=True, max_age=COOKIE_MAX_AGE, samesite="lax"
    )
    return TokenResponse(access_token=access_token)


@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
    redis=Depends(get_redis),
):
    if refresh_token:
        try:
            payload = decode_token(refresh_token)
            user_id = int(payload["sub"])
            await service.delete_refresh_token(redis, user_id)
        except Exception:
            pass
    response.delete_cookie(REFRESH_COOKIE)
    return {"message": "로그아웃 완료"}


@router.get("/check-email")
async def check_email(
    email: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_database_session),
):
    available = await service.check_email_available(db, email)
    return {"available": available}


@router.get("/check-nickname")
async def check_nickname(
    nickname: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_database_session),
):
    available = await service.check_nickname_available(db, nickname)
    return {"available": available}


@router.get("/owner", response_model=UserResponse)
async def owner(db: AsyncSession = Depends(get_database_session)):
    from sqlalchemy import select
    from app.core.models import User
    result = await db.execute(select(User).order_by(User.id).limit(1))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="사용자 없음")
    return UserResponse(id=user.id, email=user.email, nickname=user.nickname)


@router.get("/me", response_model=UserResponse)
async def me(
    current_user=Depends(get_current_user),
):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        nickname=current_user.nickname,
        profile_image_url=current_user.profile_image_url,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
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
    response.set_cookie(
        key=REFRESH_COOKIE, value=new_refresh,
        httponly=True, max_age=COOKIE_MAX_AGE, samesite="lax"
    )
    return TokenResponse(access_token=new_access)
