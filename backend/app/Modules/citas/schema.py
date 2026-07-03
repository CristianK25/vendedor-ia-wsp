from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CitaCreate(BaseModel):
    cliente_telefono: str
    trabajador_id: int
    fecha: datetime

class CitaUpdate(BaseModel):
    cliente_telefono: Optional[str] = None
    trabajador_id: Optional[int] = None
    fecha: Optional[datetime] = None
    estado: Optional[str] = None

class CitaResponse(BaseModel):
    id: int
    cliente_telefono: str
    trabajador_id: int
    fecha: datetime
    estado: str
