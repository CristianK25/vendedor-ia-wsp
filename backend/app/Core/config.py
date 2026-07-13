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
    N8N_WEBHOOK_URL: str = "https://seminocturnal-willena-unbeseeching.ngrok-free.dev/webhook-test/94fef72b-163c-42cf-972e-5538f5b482ed"
    model_config = {
        "env_file": "../.env",
        "extra": "ignore"
    }

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()
