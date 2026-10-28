from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel

class AgentChatMessage(SQLModel, table=True):
    __tablename__ = "agent_chat_messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(index=True)      # El teléfono o identificador del cliente
    role: str                                # "user" o "assistant"
    content: str                             # Texto del mensaje
    camino: Optional[str] = None             # "catalogo", "tasacion", etc.
    created_at: datetime = Field(default_factory=datetime.utcnow)
