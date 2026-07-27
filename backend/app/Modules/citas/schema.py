from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CitaCreate(BaseModel):
    cliente_telefono: str
    vehiculo_id: Optional[int] = None
    fecha: datetime
    estado: Optional[str] = "confirmada"

class CitaUpdate(BaseModel):
    cliente_telefono: Optional[str] = None
    vehiculo_id: Optional[int] = None
    fecha: Optional[datetime] = None
    estado: Optional[str] = None

class CitaResponse(BaseModel):
    id: int
    cliente_telefono: str
    cliente_nombre: Optional[str] = None
    vehiculo_id: Optional[int] = None
    vehiculo_modelo: Optional[str] = None
    vehiculo_patente: Optional[str] = None
    fecha: datetime
    fecha_creacion: Optional[datetime]
    estado: str
