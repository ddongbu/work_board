import uvicorn
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from sqlalchemy import text

from app.core.config import settings
from app.logger import init_logger
from app.core.db import db_manager
from app.core.models import Base
from app.api.users.router import router as users_router
from app.api.groups.router import router as groups_router
from app.api.fields.router import router as fields_router
from app.api.entities.router import router as entities_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_logger(settings.PROJECT_NAME)

    async with db_manager.engines["DB"].begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS app"))
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter()

api.include_router(users_router, prefix="/users", tags=["users"])
api.include_router(groups_router, prefix="/groups", tags=["groups"])
api.include_router(fields_router, prefix="/fields", tags=["fields"])
api.include_router(entities_router, prefix="/entities", tags=["entities"])

app.include_router(api)

@app.get("/")
async def health_check():
    return {"status": "ok"}

if __name__ == '__main__':
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
