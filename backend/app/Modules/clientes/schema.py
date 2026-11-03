from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.Modules.clientes.model import EstadoConversacion
from app.Modules.etiquetas.schema import EtiquetaResponse

class ClienteCreate(BaseModel):
    telefono: str
    nombre: Optional[str] = None
    etiqueta_id: Optional[int] = None

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    ultimo_mensaje_bot: Optional[datetime] = None
    ultima_interaccion_cliente: Optional[datetime] = None
    cantidad_compras: Optional[int] = None
    estado_conversacion: Optional[EstadoConversacion] = None
    id_mensaje_esperado: Optional[int] = None
    etiqueta_id: Optional[int] = None
    activo: Optional[bool] = None

class ClienteResponse(BaseModel):
    telefono: str
    nombre: Optional[str] = None
    ultimo_mensaje_bot: Optional[datetime] = None
    ultima_interaccion_cliente: Optional[datetime] = None
    cantidad_compras: int
    estado_conversacion: EstadoConversacion
    id_mensaje_esperado: Optional[int] = None
    tiene_cita_pendiente: bool = False
    etiqueta: Optional[EtiquetaResponse] = None
    activo: bool = True

class PaginatedClientesResponse(BaseModel):
    items: List[ClienteResponse]
    total: int
    page: int
    size: int
    total_pages: int
    requiere_humano_count: int = 0

class ClienteChatMessageResponse(BaseModel):
    id: int
    session_id: str
    role: str
    content: str
    camino: Optional[str] = None
    created_at: datetime

class ClienteInteraccionResumenResponse(BaseModel):
    id: int
    tipo: str
    vehiculo_id: Optional[int] = None
    vehiculo_nombre: Optional[str] = None
    vehiculo_modelo_tasacion: Optional[str] = None
    precio_pretendido: Optional[float] = None
    detalles_tasacion: Optional[str] = None
    fecha: datetime

class ClienteHistorialChatResponse(BaseModel):
    cliente: ClienteResponse
    mensajes: List[ClienteChatMessageResponse]
    interacciones: List[ClienteInteraccionResumenResponse] = []
