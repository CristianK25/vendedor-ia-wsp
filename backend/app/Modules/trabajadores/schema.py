from pydantic import BaseModel
from typing import Optional, List

class TrabajadorResponse(BaseModel):
    id: int
    nombre: str
    telefono: Optional[str] = None
    rol: Optional[str] = None
    
class PaginatedTrabajadoresResponse(BaseModel):
    items: List[TrabajadorResponse]
    total: int
    page: int
    size: int
    total_pages: int
