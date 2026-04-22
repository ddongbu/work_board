from typing import Dict, List

from fastapi import APIRouter, Depends

from app.api.users import service
from app.api.users.repository.base_users_repository import BaseUserRepository
from app.api.users.schema import UserRes, UserReq
from app.api.users.services.base_users_service import BaseUserService
from app.core.schema import BaseResponse
from app.core.session_manager import SessionManager

router = APIRouter()


@router.get("", response_model=BaseResponse[Dict[str, List[UserRes]]])
async def get_users():

    data = await service.get_all_users()

    return BaseResponse(message="SUCCESS", data={"list": data})

@router.post("")
async def create_user(
        req: UserReq,
        session_manager: SessionManager = Depends()
):
    base_user_service = session_manager.inject(BaseUserService, BaseUserRepository)

    await base_user_service.create_user(req)

    return BaseResponse(message="SUCCESS")

