from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PeticionRead(BaseModel):
    id: int
    cliente_nombre: str
    cliente_telefono: str
    vehiculo_modelo: Optional[str] = None
    fecha_propuesta: datetime
    origen: str
    estado: str
    peticion_padre_id: Optional[int] = None
    
    class Config:
        from_attributes = True

class PeticionPosponer(BaseModel):
    fecha_propuesta: datetime
