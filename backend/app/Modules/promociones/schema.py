from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PromocionCreate(BaseModel):
    titulo: str
    descripcion: str
    fecha_inicio: datetime
    fecha_fin: datetime

class PromocionUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    estado: Optional[str] = None

class PromocionResponse(BaseModel):
    id: int
    titulo: str
    descripcion: str
    fecha_inicio: datetime
    fecha_fin: datetime
    estado: str
