import enum
from typing import Optional
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel

class EstadoConversacion(str, enum.Enum):
    NORMAL = "NORMAL"
    ESPERANDO_RESEÑA = "ESPERANDO_RESEÑA"
    ESPERANDO_PAGO = "ESPERANDO_PAGO"

class Cliente(SQLModel, table=True):
    __tablename__ = "clientes"
    telefono: str = Field(primary_key=True)
    nombre: Optional[str] = None
    ultimo_mensaje_bot: Optional[datetime] = None
    ultima_interaccion_cliente: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    cantidad_compras: int = Field(default=0)
    estado_conversacion: EstadoConversacion = Field(default=EstadoConversacion.NORMAL)
    id_mensaje_esperado: Optional[int] = None
    etiqueta_id: Optional[int] = Field(default=None, foreign_key="etiquetas.id", nullable=True)
    activo: bool = Field(default=True)
