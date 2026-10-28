from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Index
from sqlmodel import Field, SQLModel


def utcnow_naive() -> datetime:
    """Retorna la fecha/hora actual en UTC sin tzinfo para compatibilidad con TIMESTAMP WITHOUT TIME ZONE."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class AgentChatMessage(SQLModel, table=True):
    __tablename__ = "agent_chat_messages"
    __table_args__ = (
        Index("ix_agent_chat_messages_session_created", "session_id", "created_at"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(index=True, max_length=64)  # El teléfono o identificador del cliente
    role: str = Field(max_length=16)                    # "user" o "assistant"
    content: str                                        # Texto del mensaje
    camino: Optional[str] = Field(default=None, max_length=32)  # "catalogo", "tasacion", etc.
    created_at: datetime = Field(default_factory=utcnow_naive)
