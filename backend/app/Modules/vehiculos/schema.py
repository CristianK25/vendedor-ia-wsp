from pydantic import BaseModel
from typing import Optional, List

class ImagenResponse(BaseModel):
    id: int
    ruta: str
    es_principal: bool
    orden: int

class VehiculoCreate(BaseModel):
    modelo: str
    precio: float
    kilometraje: int
    detalle_interior: Optional[str] = None
    detalle_exterior: Optional[str] = None
    informacion_extra: Optional[str] = None

class VehiculoUpdate(BaseModel):
    modelo: Optional[str] = None
    precio: Optional[float] = None
    kilometraje: Optional[int] = None
    detalle_interior: Optional[str] = None
    detalle_exterior: Optional[str] = None
    informacion_extra: Optional[str] = None
    estado: Optional[str] = None

class VehiculoResponse(BaseModel):
    id: int
    modelo: str
    precio: float
    kilometraje: int
    detalle_interior: Optional[str] = None
    detalle_exterior: Optional[str] = None
    informacion_extra: Optional[str] = None
    estado: str
    imagenes: List[ImagenResponse] = []

class PaginatedVehiculosResponse(BaseModel):
    items: List[VehiculoResponse]
    total: int
    page: int
    size: int
    total_pages: int
