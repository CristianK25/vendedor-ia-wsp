from sqlmodel import create_engine, Session
from app.Core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,
    pool_pre_ping=True,
)

def get_session():
    with Session(engine) as session:
        yield session
