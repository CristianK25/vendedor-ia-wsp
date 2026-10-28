from datetime import datetime, timedelta, timezone
from functools import lru_cache
import logging
from typing import Dict, List
from sqlmodel import Session, select

from app.Core.config import settings
from app.Modules.agent.handlers.base import BaseHandler
from app.Modules.agent.handlers.catalogo import CatalogoHandler
from app.Modules.agent.handlers.fallback import FallbackHandler
from app.Modules.agent.handlers.financiacion import FinanciacionHandler
from app.Modules.agent.handlers.humano import HumanoHandler
from app.Modules.agent.handlers.negociacion import NegociacionHandler
from app.Modules.agent.handlers.peticion import PeticionHandler
from app.Modules.agent.handlers.tasacion import TasacionHandler
from app.Modules.agent.llm import LLMUnavailableError
from app.Modules.agent.model import AgentChatMessage
from app.Modules.agent.schema import AgentChatRequest, AgentChatResponse, Camino, ChatTurn

logger = logging.getLogger("agent.service")

# Caminos conversacionales que deben mantenerse activos ante respuestas cortas ("Sí", "Dale")
# que Laya (sin contexto multi-turno) clasifica como "fallback" o "general".
CAMINOS_CON_CONTINUIDAD = {
    Camino.catalogo.value,
    Camino.tasacion.value,
    Camino.financiacion.value,
    Camino.negociacion.value,
    Camino.peticion.value,
    Camino.agendar_cita.value,
}

CAMINOS_GENERICOS = {
    Camino.fallback.value,
    Camino.general.value,
}


class AgentService:
    """Orquestador principal y despachador de caminos del Agente IA con persistencia en DB."""

    def __init__(self):
        self.catalogo_handler = CatalogoHandler()
        self.humano_handler = HumanoHandler()
        self.fallback_handler = FallbackHandler()
        self.tasacion_handler = TasacionHandler()
        self.financiacion_handler = FinanciacionHandler()
        self.negociacion_handler = NegociacionHandler()
        self.peticion_handler = PeticionHandler()

        self.handlers: Dict[str, BaseHandler] = {
            Camino.catalogo.value: self.catalogo_handler,
            Camino.humano.value: self.humano_handler,
            Camino.fallback.value: self.fallback_handler,
            Camino.general.value: self.fallback_handler,
            Camino.tasacion.value: self.tasacion_handler,
            Camino.financiacion.value: self.financiacion_handler,
            Camino.negociacion.value: self.negociacion_handler,
            Camino.peticion.value: self.peticion_handler,
            Camino.agendar_cita.value: self.peticion_handler,
        }

    @staticmethod
    def guardar_mensaje(
        session: Session,
        session_id: str,
        role: str,
        content: str,
        camino: str | None = None,
    ) -> AgentChatMessage:
        """Persiste un turno de conversación ('user' o 'assistant') en agent_chat_messages."""
        msg = AgentChatMessage(
            session_id=session_id,
            role=role,
            content=content,
            camino=camino,
        )
        session.add(msg)
        return msg

    @staticmethod
    def obtener_historial_reciente(
        session: Session,
        session_id: str,
        limit: int = 6,
    ) -> List[ChatTurn]:
        """
        Obtiene los últimos N mensajes ordenados cronológicamente y los transforma en DTOs
        (`ChatTurn`) para poder cerrar la transacción antes de invocar al LLM.
        """
        statement = (
            select(AgentChatMessage)
            .where(AgentChatMessage.session_id == session_id)
            .order_by(AgentChatMessage.created_at.desc(), AgentChatMessage.id.desc())
            .limit(limit)
        )
        mensajes = session.exec(statement).all()
        return [
            ChatTurn(
                role="assistant" if m.role == "assistant" else "user",
                content=m.content,
                camino=m.camino,
                created_at=m.created_at,
            )
            for m in reversed(mensajes)
        ]

    def _resolver_camino_efectivo(self, camino_entrante: str, historial: List[ChatTurn]) -> str:
        """
        Si Laya envía 'fallback'/'general' o un camino desconocido pero existe una conversación activa
        reciente (dentro de AGENT_SESSION_TTL_MINUTES), mantiene el último camino activo.
        """
        if camino_entrante in self.handlers and camino_entrante not in CAMINOS_GENERICOS:
            return camino_entrante

        if historial:
            ultimo = historial[-1]
            if ultimo.camino in CAMINOS_CON_CONTINUIDAD and ultimo.created_at is not None:
                ventana = timedelta(minutes=settings.AGENT_SESSION_TTL_MINUTES)
                ultimo_dt = (
                    ultimo.created_at.replace(tzinfo=timezone.utc)
                    if ultimo.created_at.tzinfo is None
                    else ultimo.created_at
                )
                if (datetime.now(timezone.utc) - ultimo_dt) <= ventana:
                    logger.info(
                        "Continuidad conversacional aplicada: '%s' -> '%s'",
                        camino_entrante,
                        ultimo.camino,
                    )
                    return ultimo.camino

        return Camino.fallback.value

    def process_chat(self, payload: AgentChatRequest, session: Session) -> AgentChatResponse:
        camino_efectivo = payload.camino

        try:
            # 1. Leer historial previo (DTOs) y resolver continuidad de camino
            historial = self.obtener_historial_reciente(session, payload.session_id, limit=6)
            camino_efectivo = self._resolver_camino_efectivo(payload.camino, historial)

            # 2. Guardar y confirmar de inmediato el turno del cliente (transacción corta).
            # Así el mensaje del cliente nunca se pierde aunque luego falle el proveedor LLM.
            self.guardar_mensaje(
                session=session,
                session_id=payload.session_id,
                role="user",
                content=payload.mensaje,
                camino=camino_efectivo,
            )
            session.commit()

            # 3. Despachar al handler correspondiente
            handler = self.handlers.get(camino_efectivo, self.fallback_handler)
            logger.info(
                "Despachando camino '%s' con %s (%d msgs previos)",
                camino_efectivo,
                handler.__class__.__name__,
                len(historial),
            )
            response = handler.handle(payload, session, historial=historial)

            # 4. Guardar y confirmar la respuesta generada por el asistente (transacción corta)
            self.guardar_mensaje(
                session=session,
                session_id=payload.session_id,
                role="assistant",
                content=response.respuesta_texto,
                camino=response.camino,
            )
            session.commit()
            return response

        except LLMUnavailableError as exc:
            session.rollback()
            logger.error("Proveedores LLM no disponibles en sesión: %s", str(exc))
            return AgentChatResponse(
                respuesta_texto=(
                    "¡Hola! Disculpá, justo tuve un problema técnico momentáneo al consultar el sistema. "
                    "En un ratito Maxi te escribe directamente por acá para ayudarte 👌"
                ),
                camino=camino_efectivo,
                accion_ejecutada="error_llm",
                derivar_a_humano=True,
                metadata={
                    "session_id": payload.session_id,
                    "error": True,
                },
            )
        except Exception:
            session.rollback()
            logger.exception("Error inesperado en process_chat")
            return AgentChatResponse(
                respuesta_texto=(
                    "¡Hola! Disculpá, justo tuve un problema técnico momentáneo al consultar el sistema. "
                    "¿Me podrías reiterar tu consulta o preferís que Maxi te escriba en un ratito? 👌"
                ),
                camino=camino_efectivo,
                accion_ejecutada="error_llm",
                derivar_a_humano=True,
                metadata={
                    "session_id": payload.session_id,
                    "error": True,
                },
            )


@lru_cache
def get_agent_service() -> AgentService:
    """Proveedor de dependencia para inyectar AgentService en FastAPI y facilitar mocks en tests."""
    return AgentService()


agent_service = get_agent_service()
