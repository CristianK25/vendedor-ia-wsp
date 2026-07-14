from typing import Optional
from sqlmodel import Field, SQLModel

class Trabajador(SQLModel, table=True):
    __tablename__ = "trabajadores"
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    telefono: str = Field(unique=True)
    rol: str = Field(default="vendedor")
    recibe_notificaciones: bool = Field(default=True)
