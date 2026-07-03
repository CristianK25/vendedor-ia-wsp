from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel

class Cita(SQLModel, table=True):
    __tablename__ = "citas"
    id: Optional[int] = Field(default=None, primary_key=True)
    cliente_telefono: str = Field(foreign_key="clientes.telefono")
    trabajador_id: int = Field(foreign_key="trabajadores.id")
    fecha: datetime
    estado: str = Field(default="pendiente")
