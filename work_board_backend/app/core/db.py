from contextlib import asynccontextmanager
from contextvars import ContextVar
from typing import Dict

from sqlalchemy.ext.asyncio import async_scoped_session, async_sessionmaker, AsyncSession, create_async_engine

from app.core.config import settings


class DatabaseSessionManager:
    session_context: ContextVar[str] = ContextVar("session_context")

    def __init__(self):
        self.engines = {
            "DB": create_async_engine(str(settings.SQLALCHEMY_DATABASE_URI),
                                          pool_pre_ping=True,
                                          pool_recycle=600,
                                          echo=True)
        }

        self._async_session_factory = {
            name:
                async_sessionmaker(
                    class_=AsyncSession,
                    bind=engine,
                    expire_on_commit=False,
                )
            for name, engine in self.engines.items()
        }

        self.session: Dict[str, async_scoped_session] = {
            name: async_scoped_session(
                session_factory=self._async_session_factory.get(name),
                scopefunc=self.get_session_context,
            )
            for name, engine in self.engines.items()
        }

    def get_session_context(self) -> str:
        return self.session_context.get()

    @asynccontextmanager
    async def get_session(self, db):
        session_factory = self._async_session_factory.get(db)
        if not session_factory:
            raise ValueError(f"Unknown database: {db}")

        session = session_factory()
        try:
            yield session
        finally:
            await session.close()

    async def fetch_first(self, db, query):
        async with self.get_session(db) as read_session:
            result = await read_session.scalars(query)
            return result.first()

    async def fetch_one(self, db, query):
        async with self.get_session(db) as read_session:
            result = await read_session.execute(query)
            return result.scalars().one_or_none()

    async def fetch_unique(self, db, query):
        async with self.get_session(db) as read_session:
            result = await read_session.execute(query)
            return result.unique().all()

    async def fetch_join_first(self, db, query):
        async with self.get_session(db) as read_session:
            result = await read_session.execute(query)
            return result.first()

    async def fetch_join_all(self, db, query):
        async with self.get_session(db) as read_session:
            result = await read_session.execute(query)
            return result.all()

    async def fetch_all(self, db, query):
        async with self.get_session(db) as read_session:
            result = await read_session.execute(query)
            return result.scalars().all()

    async def fetch_unique_all(self, db, query):
        async with self.get_session(db) as read_session:
            result = await read_session.scalars(query)
            return result.unique().all()

    @asynccontextmanager
    async def get_db_session(self, db_name: str = "DB"):
        async with self.get_session(db_name) as session:
            try:
                yield session
                await session.commit()
            except Exception as e:
                await session.rollback()
                raise e
            finally:
                await session.close()


# 전역 세션 매니저 인스턴스
db_manager = DatabaseSessionManager()


# FastAPI Dependency로 사용할 함수
async def get_database_session():
    async with db_manager.get_db_session() as session:
        yield session

