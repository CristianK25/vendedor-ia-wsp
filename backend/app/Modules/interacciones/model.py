import enum
from typing import Optional
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel

class TipoIntencion(str, enum.Enum):
    compra = "compra"
    venta_tasacion = "venta_tasacion"
    consulta_general = "consulta_general"

class Interaccion(SQLModel, table=True):
    __tablename__ = "interacciones"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    cliente_telefono: str = Field(foreign_key="clientes.telefono", index=True)
    vehiculo_id: Optional[int] = Field(default=None, foreign_key="vehiculos.id", nullable=True)
    tipo: TipoIntencion = Field(default=TipoIntencion.consulta_general)
    
    # Si quiere vender su auto:
    vehiculo_modelo_tasacion: Optional[str] = Field(default=None)
    precio_pretendido: Optional[float] = Field(default=None)
    detalles_tasacion: Optional[str] = Field(default=None)
    
    fecha: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    respondido: bool = Field(default=False)
    seguimiento_completado: bool = Field(default=False)
