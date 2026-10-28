import logging
from sqlmodel import Session
from app.Modules.agent.schema import AgentChatRequest, AgentChatResponse

logger = logging.getLogger("agent.fallback")

class FallbackHandler:
    """Manejador para consultas generales o caminos no implementados aún."""

    async def handle(self, payload: AgentChatRequest, session: Session) -> AgentChatResponse:
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

