from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel

class Cita(SQLModel, table=True):
    __tablename__ = "citas"
    id: Optional[int] = Field(default=None, primary_key=True)
    cliente_telefono: str = Field(foreign_key="clientes.telefono")
    vehiculo_id: Optional[int] = Field(default=None, foreign_key="vehiculos.id")
    fecha: datetime
    fecha_creacion: Optional[datetime] = Field(default=None)
    estado: str = Field(default="pendiente")
