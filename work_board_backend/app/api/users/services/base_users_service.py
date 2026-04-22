from app.api.users.repository.base_users_repository import BaseUserRepository


class BaseUserService:
    def __init__(self, repository: BaseUserRepository):
        self.repository = repository

    async def create_user(self, new_user):
        result = await self.repository.insert_user(new_user)
        return result
