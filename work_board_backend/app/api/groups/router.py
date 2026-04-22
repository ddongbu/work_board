from typing import Dict, List

from fastapi import APIRouter, Depends

from app.api.groups import service
from app.api.groups.repository.base_groups_repository import BaseGroupRepository
from app.api.groups.schema import GroupRes, GroupReq
from app.api.groups.services.base_groups_service import BaseGroupService
from app.core.schema import BaseResponse
from app.core.session_manager import SessionManager

router = APIRouter()


@router.get("", response_model=BaseResponse[Dict[str, List[GroupRes]]])
async def get_group_list():
    data = await service.get_all_groups()

    return BaseResponse(message="SUCCESS", data={"list": data})


@router.get("/{group_key}", response_model=BaseResponse[GroupRes])
async def get_group(
    group_key: int
):
    info = await service.get_group_info(group_key)

    return BaseResponse(message="SUCCESS", data=info)


@router.post("")
async def create_group(
        req: GroupReq,
        session_manager: SessionManager = Depends()
):
    base_group_service = session_manager.inject(BaseGroupService, BaseGroupRepository)

    await base_group_service.create_group(req)
    return BaseResponse(message="SUCCESS")


# TODO: 그룹에 속한 맴버들 확인
