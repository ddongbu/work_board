import uuid
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from app.api.auth.router import get_current_user
from app.core.config import settings

router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}
MIME_TO_EXT = {"image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# 파일 매직 바이트 (MIME 스푸핑 방지)
MAGIC_BYTES: dict[bytes, str] = {
    b'\xff\xd8\xff': "image/jpeg",
    b'\x89PNG\r\n\x1a\n': "image/png",
    b'GIF87a': "image/gif",
    b'GIF89a': "image/gif",
}


def _detect_mime(data: bytes) -> str | None:
    for magic, mime in MAGIC_BYTES.items():
        if data[:len(magic)] == magic:
            return mime
    # WebP: RIFF + 4바이트(크기) + WEBP 모두 확인 (WAV/AVI 등 다른 RIFF 포맷 차단)
    if len(data) >= 12 and data[:4] == b'RIFF' and data[8:12] == b'WEBP':
        return "image/webp"
    return None


def _s3_client():
    if not settings.AWS_S3_BUCKET or not settings.AWS_ACCESS_KEY_ID:
        raise HTTPException(status_code=503, detail="S3 설정이 완료되지 않았습니다.")
    return boto3.client(
        "s3",
        region_name=settings.AWS_S3_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    folder: str = Query("posts", pattern="^(posts|profiles)$"),
    _=Depends(get_current_user),
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="허용되지 않는 파일 형식입니다. (jpeg/png/gif/webp만 가능)")

    filename = file.filename or ""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        # 모바일 카메라 등 확장자 없이 올라오는 경우 MIME 타입에서 유도
        ext = MIME_TO_EXT.get(file.content_type, "")
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="허용되지 않는 파일 확장자입니다.")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="빈 파일은 업로드할 수 없습니다.")
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="파일 크기는 10MB를 초과할 수 없습니다.")

    # MIME 스푸핑 방지: 실제 파일 내용으로 검증
    actual_mime = _detect_mime(data)
    if actual_mime is None or actual_mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="파일 내용이 선언된 형식과 일치하지 않습니다.")

    safe_key = f"{folder}/{uuid.uuid4().hex}.{ext}"

    try:
        s3 = _s3_client()
        s3.put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=safe_key,
            Body=data,
            ContentType=actual_mime,
            CacheControl='public, max-age=31536000',  # 브라우저 1년 캐싱
        )
    except HTTPException:
        raise
    except (BotoCoreError, ClientError) as e:
        raise HTTPException(status_code=500, detail=f"S3 업로드 실패: {str(e)}")

    url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_S3_REGION}.amazonaws.com/{safe_key}"
    return {"url": url}
