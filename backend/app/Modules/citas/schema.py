from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CitaCreate(BaseModel):
    cliente_telefono: str
    fecha: datetime

class CitaUpdate(BaseModel):
    cliente_telefono: Optional[str] = None
    fecha: Optional[datetime] = None
    estado: Optional[str] = None

class CitaResponse(BaseModel):
    id: int
    cliente_telefono: str
    cliente_nombre: Optional[str] = None
    fecha: datetime
    fecha_creacion: Optional[datetime]
    estado: str
