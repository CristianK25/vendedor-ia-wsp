from pydantic import BaseModel, Field
from typing import Optional, Any

class AgentChatRequest(BaseModel):
    session_id: str
    cliente_telefono: str
    cliente_nombre: Optional[str] = None
    camino: str = Field(..., description="Camino detectado por Laya: catalogo, tasacion, financiacion, agendar_cita, negociacion, humano, etc.")
    mensaje: str

class AgentChatResponse(BaseModel):
    respuesta_texto: str
    camino: str
    accion_ejecutada: Optional[str] = None
    derivar_a_humano: bool = False
    metadata: Optional[dict[str, Any]] = None
