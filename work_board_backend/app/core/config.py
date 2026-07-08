import os
from pydantic import PostgresDsn, computed_field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "Work Board"
    API_V1_STR: str = "/api/v1"
    API_ENV: str = "local"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # JWT
    JWT_SECRET_KEY: str = "changeme"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    # AWS S3
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = ""
    AWS_S3_REGION: str = "ap-northeast-2"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def CORS_ORIGINS_LIST(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "danny"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = "work_board"

    @computed_field  # type: ignore[prop-decorator]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )


class LocalSettings(Settings):
    """로컬 개발 환경 설정 - _DEV 환경변수 사용"""

    @model_validator(mode="after")
    def apply_dev_env_vars(self):
        # _DEV 환경변수가 있으면 해당 값으로 오버라이드
        env_mapping = {
            "POSTGRES_SERVER": "POSTGRES_SERVER_DEV",
            "POSTGRES_PORT": "POSTGRES_PORT_DEV",
            "POSTGRES_USER": "POSTGRES_USER_DEV",
            "POSTGRES_PASSWORD": "POSTGRES_PASSWORD_DEV",
            "POSTGRES_DB": "POSTGRES_DB_DEV",
            "REDIS_HOST": "REDIS_HOST_DEV",
            "REDIS_PORT": "REDIS_PORT_DEV",
        }

        for field_name, env_key in env_mapping.items():
            if env_key in os.environ and os.environ[env_key]:
                raw_val = os.environ[env_key]
                target_type = self.model_fields[field_name].annotation
                try:
                    value = target_type(raw_val) if target_type is not None else raw_val
                except Exception:
                    value = raw_val
                object.__setattr__(self, field_name, value)

        return self


class ProductionSettings(Settings):
    """프로덕션 환경 설정 - _PROD 환경변수 사용"""

    @model_validator(mode="after")
    def apply_prod_env_vars(self):
        env_mapping = {
            "POSTGRES_SERVER": "POSTGRES_SERVER_PROD",
            "POSTGRES_PORT": "POSTGRES_PORT_PROD",
            "POSTGRES_USER": "POSTGRES_USER_PROD",
            "POSTGRES_PASSWORD": "POSTGRES_PASSWORD_PROD",
            "POSTGRES_DB": "POSTGRES_DB_PROD",
            "REDIS_HOST": "REDIS_HOST_PROD",
            "REDIS_PORT": "REDIS_PORT_PROD",
        }

        for field_name, env_key in env_mapping.items():
            if env_key in os.environ and os.environ[env_key]:
                raw_val = os.environ[env_key]
                target_type = self.model_fields[field_name].annotation
                try:
                    value = target_type(raw_val) if target_type is not None else raw_val
                except Exception:
                    value = raw_val
                object.__setattr__(self, field_name, value)

        return self


def get_settings() -> Settings:
    env = os.getenv("API_ENV", "local").lower()

    config_map = {
        "local": LocalSettings,
        "prod": ProductionSettings,
        "production": ProductionSettings,
    }

    config_class = config_map.get(env, LocalSettings)
    return config_class()


settings = get_settings()
