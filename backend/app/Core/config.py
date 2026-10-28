import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Vendedor IA API"
    POSTGRES_USER: str = "n8n"
    POSTGRES_PASSWORD: str = "n8npassword"
    POSTGRES_DB: str = "vendedor_ia"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: str = "5433"
    DB_ECHO: bool = False
    # TODO(security): Validate in production startup that SECRET_KEY and default passwords are overridden
    SECRET_KEY: str = "supersecretkey_change_me_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    N8N_WEBHOOK_BASE_URL: str = "http://n8n:5678/webhook"
    N8N_API_KEY: str = ""
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    BACKEND_CORS_ORIGINS: str = "*"
    INITIAL_ADMIN_EMAIL: str = "admin@vendedor.com"
    INITIAL_ADMIN_PASSWORD: str = "admin123"
    INITIAL_BOT_EMAIL: str = "bot@vendedor.com"
    INITIAL_BOT_PASSWORD: str = "bot1234"

    # Configuración de Proveedores LLM (Agente IA)
    LLM_PROVIDER_ORDER: str = "openai,anthropic,groq,gemini"
    LLM_TIMEOUT_SECONDS: float = 12.0
    AGENT_SESSION_TTL_MINUTES: int = 30

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-3-5-haiku-latest"

    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-8b-instant"

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    model_config = {
        "env_file": "../.env",
        "extra": "ignore"
    }

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()
