from pydantic import BaseModel
from typing import Optional

class VehiculoCreate(BaseModel):
    modelo: str
    precio: float
    kilometraje: int
    imagenes: Optional[str] = None
    detalle_interior: Optional[str] = None
    detalle_exterior: Optional[str] = None
    informacion_extra: Optional[str] = None

class VehiculoUpdate(BaseModel):
    modelo: Optional[str] = None
    precio: Optional[float] = None
    kilometraje: Optional[int] = None
    imagenes: Optional[str] = None
    detalle_interior: Optional[str] = None
    detalle_exterior: Optional[str] = None
    informacion_extra: Optional[str] = None
    estado: Optional[str] = None

class VehiculoResponse(BaseModel):
    id: int
    modelo: str
    precio: float
    kilometraje: int
    imagenes: Optional[str] = None
    detalle_interior: Optional[str] = None
    detalle_exterior: Optional[str] = None
    informacion_extra: Optional[str] = None
    estado: str
