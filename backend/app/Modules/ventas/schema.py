from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class VentaCreate(BaseModel):
    vehiculo_id: int
    cliente_telefono: str
    precio_final: float

class VentaResponse(BaseModel):
    id: int
    vehiculo_id: int
    vehiculo_modelo: Optional[str] = None
    cliente_telefono: str
    cliente_nombre: Optional[str] = None
    fecha: datetime
    precio_final: float

class PaginatedVentasResponse(BaseModel):
    items: List[VentaResponse]
    total: int
    page: int
    size: int
    total_pages: int
