from pydantic import BaseModel
from typing import Optional

class EtiquetaCreate(BaseModel):
    nombre: str
    color: str

class EtiquetaUpdate(BaseModel):
    nombre: Optional[str] = None
    color: Optional[str] = None

class EtiquetaResponse(BaseModel):
    id: int
    nombre: str
    color: str
    cantidad_clientes: int = 0
