from pydantic import BaseModel
from typing import Optional, List

class TrabajadorResponse(BaseModel):
    id: int
    nombre: str
    apellido: str
    email: str
    rol_sistema: str
    rol: Optional[str] = None
    telefono: Optional[str] = None
    recibe_notificaciones: bool = True
    
class PaginatedTrabajadoresResponse(BaseModel):
    items: List[TrabajadorResponse]
    total: int
    page: int
    size: int
    total_pages: int
