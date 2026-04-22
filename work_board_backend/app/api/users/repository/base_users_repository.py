from sqlalchemy.ext.asyncio import AsyncSession

from app.core.base_repository import BaseRepository
from app.core.models import Users


class BaseUserRepository(BaseRepository[Users]):
    def __init__(self, session: AsyncSession):
        super().__init__(Users, session)

    async def insert_user(self, new_user):
        result = await self.insert(data={**new_user.model_dump(exclude_defaults=True)}).returning(
            Users.id).execute()

        return result.scalar()
