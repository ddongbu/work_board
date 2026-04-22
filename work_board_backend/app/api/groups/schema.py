from datetime import datetime
from typing import Optional

from pydantic import Field

from app.core.schema import SchemaConfig


class BaseGroup(SchemaConfig):
    name: str = Field(description="그룹명", alias="name")


class GroupRes(BaseGroup):
    id: int = Field(description="KEY", alias="id")
    create_date: datetime = Field(description="생성 일시", alias="create_date")
    update_date: Optional[datetime] = Field(description="수정 일시", alias="update_date")


class GroupReq(BaseGroup):
    ...
