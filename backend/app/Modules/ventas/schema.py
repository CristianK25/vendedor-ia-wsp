from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VentaCreate(BaseModel):
    vehiculo_id: int
    cliente_telefono: str
    precio_final: float

class VentaResponse(BaseModel):
    id: int
    vehiculo_id: int
    cliente_telefono: str
    fecha: datetime
    precio_final: float
