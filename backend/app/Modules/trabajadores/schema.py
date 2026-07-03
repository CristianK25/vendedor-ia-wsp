from pydantic import BaseModel
from typing import Optional

class TrabajadorCreate(BaseModel):
    nombre: str
    telefono: str
    rol: Optional[str] = "vendedor"

class TrabajadorUpdate(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    rol: Optional[str] = None

class TrabajadorResponse(BaseModel):
    id: int
    nombre: str
    telefono: str
    rol: str
