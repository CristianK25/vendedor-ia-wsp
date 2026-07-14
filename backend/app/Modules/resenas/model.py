from typing import Optional
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel

class Resena(SQLModel, table=True):
    __tablename__ = "resenas"
    id: Optional[int] = Field(default=None, primary_key=True)
    cliente_telefono: str = Field(foreign_key="clientes.telefono")
    comentario: str
    fecha: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
