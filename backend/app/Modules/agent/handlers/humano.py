import logging
from typing import List, Optional
from sqlmodel import Session

from app.Modules.agent.handlers.base import BaseHandler
from app.Modules.agent.schema import AgentChatRequest, AgentChatResponse, Camino, ChatTurn

logger = logging.getLogger("agent.humano")


class HumanoHandler(BaseHandler):
    """Manejador para cuando el cliente solicita un asesor humano o Laya detecta handoff."""

    def handle(
        self,
        payload: AgentChatRequest,
        session: Session,
        historial: Optional[List[ChatTurn]] = None,
    ) -> AgentChatResponse:
        nombre = f" {payload.cliente_nombre}" if payload.cliente_nombre else ""

        respuesta = (
            f"¡Dale{nombre}! En un ratito Maxi se comunica con vos directamente por acá "
            f"para asesorarte de forma personalizada 👌"
        )

        return AgentChatResponse(
            respuesta_texto=respuesta,
            camino=Camino.humano.value,
            accion_ejecutada="handoff_humano",
            derivar_a_humano=True,
            metadata={
                "session_id": payload.session_id,
                "telefono": payload.cliente_telefono,
            },
        )
