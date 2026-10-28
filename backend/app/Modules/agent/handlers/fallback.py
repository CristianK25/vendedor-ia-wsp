import logging
from typing import List, Optional
from sqlmodel import Session

from app.Modules.agent.handlers.base import BaseHandler
from app.Modules.agent.schema import AgentChatRequest, AgentChatResponse, Camino, ChatTurn

logger = logging.getLogger("agent.fallback")


class FallbackHandler(BaseHandler):
    """Manejador para consultas generales o caminos no implementados aún."""

    def handle(
        self,
        payload: AgentChatRequest,
        session: Session,
        historial: Optional[List[ChatTurn]] = None,
    ) -> AgentChatResponse:
        nombre = f" {payload.cliente_nombre}" if payload.cliente_nombre else ""

        respuesta = (
            f"¡Hola{nombre}! 👋 Gracias por comunicarte con Maxi Panella. "
            f"¿En qué te puedo ayudar hoy? ¿Te interesa ver los autos que tenemos en stock, "
            f"consultar por tasación o financiación?"
        )

        return AgentChatResponse(
            respuesta_texto=respuesta,
            camino=Camino.fallback.value,
            accion_ejecutada="fallback_general",
            derivar_a_humano=False,
            metadata={"session_id": payload.session_id},
        )
