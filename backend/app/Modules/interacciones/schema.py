from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.Modules.interacciones.model import TipoIntencion

class InteraccionCreate(BaseModel):
    cliente_telefono: str
    vehiculo_id: Optional[int] = None
    tipo: TipoIntencion
    vehiculo_modelo_tasacion: Optional[str] = None
    precio_pretendido: Optional[float] = None
    detalles_tasacion: Optional[str] = None

class InteraccionUpdate(BaseModel):
    respondido: Optional[bool] = None
    seguimiento_completado: Optional[bool] = None

class InteraccionResponse(BaseModel):
    id: int
    cliente_telefono: str
    vehiculo_id: Optional[int]
    tipo: TipoIntencion
    vehiculo_modelo_tasacion: Optional[str]
    precio_pretendido: Optional[float]
    detalles_tasacion: Optional[str]
    fecha: datetime
    respondido: bool
    seguimiento_completado: bool

    model_config = ConfigDict(from_attributes=True)
