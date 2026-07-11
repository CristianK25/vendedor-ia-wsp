from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.Modules.clientes.model import EstadoConversacion

class ClienteCreate(BaseModel):
    telefono: str
    nombre: Optional[str] = None

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    ultimo_mensaje_bot: Optional[datetime] = None
    ultima_interaccion_cliente: Optional[datetime] = None
    cantidad_compras: Optional[int] = None
    estado_conversacion: Optional[EstadoConversacion] = None
    id_mensaje_esperado: Optional[int] = None

class ClienteResponse(BaseModel):
    telefono: str
    nombre: Optional[str] = None
    ultimo_mensaje_bot: Optional[datetime] = None
    ultima_interaccion_cliente: Optional[datetime] = None
    cantidad_compras: int
    estado_conversacion: EstadoConversacion
    id_mensaje_esperado: Optional[int] = None
    tiene_cita_pendiente: bool = False

from typing import List
class PaginatedClientesResponse(BaseModel):
    items: List[ClienteResponse]
    total: int
    page: int
    size: int
    total_pages: int
