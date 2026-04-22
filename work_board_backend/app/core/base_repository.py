from datetime import datetime
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union

from sqlalchemy import Delete, Insert, Result, Select, Update, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import delete, insert, update


T = TypeVar("T")  # 모델 타입을 제너릭으로 사용


class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T], session: AsyncSession):
        self.session = session
        self.model = model
        self.query: Union[Insert, Select, Update, Delete, None] = None
        self.result: Optional[Result[Any]] = None

    def set_query(self, query):
        self.query = query
        return self

    def get_query(self):
        return self.query

    def select(self, *args):
        self.query = (
            select(
                self.model
            ).where(
                *args
            )
        )
        return self

    def update(self, *args, data: Dict[str, Any]):
        self.query = (
            update(self.model)
            .where(*args)
            .values(**data, update_date=datetime.now())
        )
        return self

    def insert(self, data: Dict[str, Any]):
        self.query = insert(self.model).values(**data)
        return self

    def delete(self, *args):
        self.query = delete(self.model).where(*args)
        return self

    def options(self, *args):
        self.query = self.query.options(*args)
        return self

    def returning(self, *columns):
        if columns:
            self.query = self.query.returning(*columns)
        else:
            self.query = self.query.returning(self.model)
        return self

    def orderby(self, *args):
        self.query = self.query.order_by(*args)
        return self

    async def execute(self, sub_value: Optional[List[Dict[str, Any]]] = None):
        if self.query is None:
            raise ValueError("Query is not set before execution.")
        self.result = await self.session.execute(self.query, sub_value)
        return self

    def scalar(self):
        return self.result.scalar_one_or_none()

    def scalars(self):
        return self.result.scalars().all()

    def all(self):
        return self.result.all()

    def first(self):
        return self.result.first()

    async def flush(self):
        await self.session.flush()
        return self
