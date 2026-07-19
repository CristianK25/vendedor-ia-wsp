from typing import Optional
from sqlmodel import Field, SQLModel

class Etiqueta(SQLModel, table=True):
    __tablename__ = "etiquetas"
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(unique=True, index=True)
    color: str
