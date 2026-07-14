from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_database_session
from app.core.redis_client import get_redis
from app.api.auth.router import get_current_user, REFRESH_COOKIE
from app.api.auth.service import delete_refresh_token
from app.api.mypage.schema import ProfileUpdateRequest, PasswordChangeRequest, ProfileResponse
from app.api.mypage import service

router = APIRouter()


@router.put("/profile", response_model=ProfileResponse)
async def update_profile(
    body: ProfileUpdateRequest,
    db: AsyncSession = Depends(get_database_session),
    current_user=Depends(get_current_user),
):
    user = await service.update_profile(
        db, current_user, body.nickname, body.profile_image_url
    )
    return ProfileResponse(
        id=user.id,
        email=user.email,
        nickname=user.nickname,
        profile_image_url=user.profile_image_url,
    )


@router.put("/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    body: PasswordChangeRequest,
    db: AsyncSession = Depends(get_database_session),
    current_user=Depends(get_current_user),
):
    success = await service.change_password(
        db, current_user, body.current_password, body.new_password
    )
    if not success:
        raise HTTPException(status_code=400, detail="현재 비밀번호가 올바르지 않습니다.")


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    response: Response,
    db: AsyncSession = Depends(get_database_session),
    current_user=Depends(get_current_user),
    redis=Depends(get_redis),
):
    await delete_refresh_token(redis, current_user.id)
    response.delete_cookie(REFRESH_COOKIE)
    await service.delete_account(db, current_user)
