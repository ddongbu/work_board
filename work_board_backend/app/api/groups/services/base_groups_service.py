from app.api.groups.repository.base_groups_repository import BaseGroupRepository


class BaseGroupService:
    def __init__(self, repository: BaseGroupRepository):
        self.repository = repository

    async def create_group(self, req):
        await self.repository.insert_group(req)
