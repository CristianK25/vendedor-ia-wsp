from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel

class Promocion(SQLModel, table=True):
    __tablename__ = "promociones"
    id: Optional[int] = Field(default=None, primary_key=True)
    titulo: str
    descripcion: str
    fecha_inicio: datetime
    fecha_fin: datetime
    estado: str = Field(default="activa")
