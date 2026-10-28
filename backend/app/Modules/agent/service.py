import logging
from typing import List
from sqlmodel import Session, select

from app.Modules.agent.schema import AgentChatRequest, AgentChatResponse
from app.Modules.agent.model import AgentChatMessage
from app.Modules.agent.handlers.catalogo import CatalogoHandler
from app.Modules.agent.handlers.humano import HumanoHandler
from app.Modules.agent.handlers.fallback import FallbackHandler

logger = logging.getLogger("agent.service")

class AgentService:
    """Orquestador principal y despachador de caminos del Agente IA con persistencia en DB."""

    def __init__(self):
        self.catalogo_handler = CatalogoHandler()
        self.humano_handler = HumanoHandler()
        self.fallback_handler = FallbackHandler()

        # Diccionario de caminos disponibles
        self.handlers = {
            "catalogo": self.catalogo_handler,
            "humano": self.humano_handler,
            "fallback": self.fallback_handler,
        }

    def guardar_mensaje(
        self,
        session: Session,
        session_id: str,
        role: str,
        content: str,
        camino: str | None = None
    ) -> AgentChatMessage:
        """Persiste un turno de conversación (user o assistant) en la tabla agent_chat_messages."""
        msg = AgentChatMessage(
            session_id=session_id,
            role=role,
            content=content,
            camino=camino
        )
        session.add(msg)
        return msg

    def obtener_historial_reciente(
        self,
        session: Session,
        session_id: str,
        limit: int = 10
    ) -> List[AgentChatMessage]:
        """Obtiene los últimos N mensajes de la conversación ordenados cronológicamente."""
        statement = (
            select(AgentChatMessage)
            .where(AgentChatMessage.session_id == session_id)
            .order_by(AgentChatMessage.created_at.desc())
            .limit(limit)
        )
        mensajes = session.exec(statement).all()
        return list(reversed(mensajes))

    async def process_chat(self, payload: AgentChatRequest, session: Session) -> AgentChatResponse:
        # Sanitizar camino y mensaje
        camino = payload.camino.lstrip("=").strip().lower()
        mensaje_limpio = payload.mensaje.lstrip("=").strip()

        try:
            # 1. Recuperar historial reciente de la conversación (memoria multi-turno previa)
            historial = self.obtener_historial_reciente(session, payload.session_id, limit=6)

            # 2. Guardar en base de datos el mensaje entrante del cliente
            self.guardar_mensaje(
                session=session,
                session_id=payload.session_id,
                role="user",
                content=mensaje_limpio,
                camino=camino
            )

            # 3. Despachar al handler especializado inyectando el historial contextual
            handler = self.handlers.get(camino, self.fallback_handler)
            logger.info(f"Despachando consulta para camino: '{camino}' usando {handler.__class__.__name__} ({len(historial)} msgs en historial)")
            response = await handler.handle(payload, session, historial=historial)

            # 4. Guardar en base de datos la respuesta generada para el cliente
            self.guardar_mensaje(
                session=session,
                session_id=payload.session_id,
                role="assistant",
                content=response.respuesta_texto,
                camino=camino
            )

            # 5. Confirmar ambos turnos de forma atómica
            session.commit()
            return response

        except Exception as e:
            # 🛡️ BLINDAJE DE CONTINGENCIA:
            # Si algo falla (DB, LLM, etc.), revertir la sesión de PostgreSQL
            session.rollback()
            logger.exception(f"Error crítico en process_chat para sesión {payload.session_id}: {str(e)}")

            # Respuesta cordial de rescate para que WhatsApp nunca quede colgado
            return AgentChatResponse(
                respuesta_texto=(
                    "¡Hola! Disculpá, justo tuve un problema técnico momentáneo al consultar el sistema. "
                    "¿Me podrías reiterar tu consulta o preferís que Maxi te escriba en un ratito? 👌"
                ),
                camino=camino,
                accion_ejecutada="error_recuperado",
                derivar_a_humano=True,
                metadata={"error_tipo": str(type(e).__name__)}
            )

# Instancia singleton para uso en el router
agent_service = AgentService()
