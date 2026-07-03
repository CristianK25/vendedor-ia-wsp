from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ClienteCreate(BaseModel):
    telefono: str
    nombre: Optional[str] = None

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    ultimo_mensaje_bot: Optional[datetime] = None
    ultima_interaccion_cliente: Optional[datetime] = None
    cantidad_compras: Optional[int] = None

class ClienteResponse(BaseModel):
    telefono: str
    nombre: Optional[str] = None
    ultimo_mensaje_bot: Optional[datetime] = None
    ultima_interaccion_cliente: Optional[datetime] = None
    cantidad_compras: int
