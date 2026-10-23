import redis.asyncio as aioredis
from typing import AsyncGenerator
from app.Core.config import settings

redis_pool = aioredis.ConnectionPool(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=0,
    decode_responses=True
)

async def get_redis() -> AsyncGenerator[aioredis.Redis, None]:
    """Generador asíncrono para inyección de dependencias con Depends en FastAPI."""
    client = aioredis.Redis(connection_pool=redis_pool)
    try:
        yield client
    finally:
        await client.aclose()
