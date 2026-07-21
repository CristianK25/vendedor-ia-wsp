from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class N8NCitaCreate(BaseModel):
    vehiculo_id: Optional[int] = None
    cliente_telefono: str
    fecha: datetime
    notas: Optional[str] = None

class PeticionCreateN8N(BaseModel):
    cliente_nombre: str
    cliente_telefono: str
    vehiculo_modelo: Optional[str] = None
    fecha_propuesta: datetime

class N8NCitaCancel(BaseModel):
    cita_id: int

class N8NClienteCheck(BaseModel):
    telefono: str
    nombre: Optional[str] = None
    ultima_interaccion_cliente: Optional[datetime] = None

class N8NResenaCreate(BaseModel):
    cliente_telefono: str
    comentario: str
