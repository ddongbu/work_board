from sqlalchemy.ext.asyncio import AsyncSession

from app.core.base_repository import BaseRepository
from app.core.models import Groups


class BaseGroupRepository(BaseRepository[Groups]):
    def __init__(self, session: AsyncSession):
        super().__init__(Groups, session)

    async def insert_group(self, new_group):
        result = await self.insert(data={**new_group.model_dump(exclude_defaults=True)}).returning(
            Groups.id).execute()
        return result.scalar()
