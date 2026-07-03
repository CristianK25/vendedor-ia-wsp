from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel

class Cliente(SQLModel, table=True):
    __tablename__ = "clientes"
    telefono: str = Field(primary_key=True)
    nombre: Optional[str] = None
    ultimo_mensaje_bot: Optional[datetime] = None
    ultima_interaccion_cliente: Optional[datetime] = Field(default_factory=datetime.utcnow)
    cantidad_compras: int = Field(default=0)
