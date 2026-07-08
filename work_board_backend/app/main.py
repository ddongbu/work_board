import uvicorn
from fastapi import FastAPI, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
from loguru import logger
from sqlalchemy import text

from app.core.config import settings
from app.logger import init_logger
from app.core.db import db_manager
from app.core.models import Base
from app.core.redis_client import init_redis, close_redis


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_logger(settings.PROJECT_NAME)
    async with db_manager.engines["DB"].begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS app"))
        await conn.run_sync(Base.metadata.create_all)
    await init_redis()
    yield
    await close_redis()


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    messages = [e.get("msg", "유효하지 않은 값입니다.") for e in errors]
    return JSONResponse(status_code=422, content={"detail": messages[0] if messages else "입력값이 올바르지 않습니다."})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.method} {request.url.path}: {exc}")
    return JSONResponse(status_code=500, content={"detail": "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."})


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter()

from app.api.auth.router import router as auth_router
api.include_router(auth_router, prefix="/auth", tags=["auth"])

from app.api.posts.router import router as posts_router
api.include_router(posts_router, prefix="/posts", tags=["posts"])

from app.api.upload.router import router as upload_router
api.include_router(upload_router, prefix="/upload", tags=["upload"])

app.include_router(api)


@app.get("/")
async def health_check():
    return {"status": "ok"}


if __name__ == '__main__':
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
