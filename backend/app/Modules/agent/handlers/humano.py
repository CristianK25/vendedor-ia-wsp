import logging
from sqlmodel import Session
from app.Modules.agent.schema import AgentChatRequest, AgentChatResponse

logger = logging.getLogger("agent.humano")

class HumanoHandler:
    """Manejador para cuando el cliente solicita un asesor humano o Laya detecta handoff."""

    async def handle(self, payload: AgentChatRequest, session: Session) -> AgentChatResponse:
        nombre = f" {payload.cliente_nombre.lstrip('=').strip()}" if payload.cliente_nombre else ""

        respuesta = (
            f"¡Dale{nombre}! En un ratito Maxi se comunica con vos directamente por acá "
            f"para asesorarte de forma personalizada 👌"
        )

        return AgentChatResponse(
            respuesta_texto=respuesta,
            camino="humano",
            accion_ejecutada="handoff_humano",
            derivar_a_humano=True,
            metadata={
                "session_id": payload.session_id,
                "telefono": payload.cliente_telefono
            }
        )

