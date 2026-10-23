import redis.asyncio as aioredis
from app.Core.config import settings

redis_pool = aioredis.ConnectionPool(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=0,
    decode_responses=True
)

def get_redis_client() -> aioredis.Redis:
    """Retorna un cliente asíncrono de Redis conectado al pool."""
    return aioredis.Redis(connection_pool=redis_pool)
