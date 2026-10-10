import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Vendedor IA API"
    POSTGRES_USER: str = "n8n"
    POSTGRES_PASSWORD: str = "n8npassword"
    POSTGRES_DB: str = "vendedor_ia"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: str = "5433"
    SECRET_KEY: str = "supersecretkey_change_me_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    N8N_WEBHOOK_BASE_URL: str = "http://n8n:5678/webhook"
    N8N_API_KEY: str = ""
    BACKEND_CORS_ORIGINS: str = "*"
    INITIAL_ADMIN_EMAIL: str = "admin@vendedor.com"
    INITIAL_ADMIN_PASSWORD: str = "admin123"
    INITIAL_BOT_EMAIL: str = "bot@vendedor.com"
    INITIAL_BOT_PASSWORD: str = "bot1234"
    model_config = {
        "env_file": "../.env",
        "extra": "ignore"
    }

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()
