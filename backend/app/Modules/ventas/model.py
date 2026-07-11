from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel

class Venta(SQLModel, table=True):
    __tablename__ = "ventas"
    id: Optional[int] = Field(default=None, primary_key=True)
    vehiculo_id: int = Field(foreign_key="vehiculos.id")
    cliente_telefono: str = Field(foreign_key="clientes.telefono")
    fecha: Optional[datetime] = Field(default_factory=datetime.utcnow)
    precio_final: float
    metodo_pago: str = Field(default="Efectivo")
    notas: Optional[str] = None
