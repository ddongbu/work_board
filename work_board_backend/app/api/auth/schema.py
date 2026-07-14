import re
from pydantic import BaseModel, EmailStr, field_validator


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    nickname: str

    @field_validator('password')
    @classmethod
    def password_validate(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('비밀번호는 8자 이상이어야 합니다.')
        if len(v) > 128:
            raise ValueError('비밀번호는 128자 이하여야 합니다.')
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('비밀번호에 영문자를 포함해주세요.')
        if not re.search(r'[0-9]', v):
            raise ValueError('비밀번호에 숫자를 포함해주세요.')
        return v

    @field_validator('nickname')
    @classmethod
    def nickname_validate(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError('닉네임을 입력해주세요.')
        if len(v) < 2:
            raise ValueError('닉네임은 2자 이상이어야 합니다.')
        if len(v) > 50:
            raise ValueError('닉네임은 50자 이하여야 합니다.')
        if re.search(r'[<>"\'/\\]', v):
            raise ValueError('닉네임에 사용할 수 없는 문자가 포함되어 있습니다.')
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    nickname: str
    profile_image_url: str | None = None
