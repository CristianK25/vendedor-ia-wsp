import logging
from typing import List, Optional
from sqlmodel import Session
from app.Modules.agent.schema import AgentChatRequest, AgentChatResponse
from app.Modules.agent.model import AgentChatMessage
from app.Modules.agent.handlers.base import BaseHandler

logger = logging.getLogger("agent.fallback")

class FallbackHandler(BaseHandler):
    """Manejador para consultas generales o caminos no implementados aún."""

    async def handle(
        self,
        payload: AgentChatRequest,
        session: Session,
        historial: Optional[List[AgentChatMessage]] = None
    ) -> AgentChatResponse:
        nombre = f" {payload.cliente_nombre.lstrip('=').strip()}" if payload.cliente_nombre else ""
        mensaje_limpio = payload.mensaje.lstrip("=").strip()

        # Respuesta general con voseo argentino
        respuesta = (
            f"¡Hola{nombre}! 👋 Gracias por comunicarte con Maxi Panella. "
            f"¿En qué te puedo ayudar hoy? ¿Te interesa ver los autos que tenemos en stock, "
            f"consultar por tasación o financiación?"
        )

        return AgentChatResponse(
            respuesta_texto=respuesta,
            camino=payload.camino,
            accion_ejecutada="fallback_general",
            derivar_a_humano=False,
            metadata={"session_id": payload.session_id}
        )

