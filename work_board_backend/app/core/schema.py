from typing import Generic, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar('T')


class BaseResponse(BaseModel, Generic[T]):
    message: str
    data: Optional[T] = None
    page_info: Optional[dict] = None

    class Config:
        arbitrary_types_allowed = True


class SchemaConfig(BaseModel):

    class Config:
        from_attributes = True
        populate_by_name = True
        arbitrary_types_allowed = True
