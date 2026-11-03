from datetime import datetime, timedelta, timezone
from functools import lru_cache
import logging
from typing import Dict, List
from sqlmodel import Session, select

from app.Core.config import settings
from app.Modules.clientes.model import Cliente, EstadoConversacion
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

    def _resolver_camino_efectivo(
        self,
        camino_entrante: str,
        historial: List[ChatTurn],
        session: Session | None = None,
        telefono: str | None = None,
    ) -> str:
        """
        Si Laya envía 'fallback'/'general' o un camino desconocido pero existe una conversación activa
        reciente (dentro de AGENT_SESSION_TTL_MINUTES) o una propuesta de reprogramación de cita
        pendiente de respuesta del cliente (pendiente_cliente), mantiene el camino correspondiente.
        """
        if camino_entrante in self.handlers and camino_entrante not in CAMINOS_GENERICOS:
            return camino_entrante

        if session is not None and telefono:
            from app.Modules.peticiones.model import Peticion
            peticion_pendiente_cliente = session.exec(
                select(Peticion).where(
                    Peticion.cliente_telefono == telefono,
                    Peticion.estado == "pendiente_cliente",
                )
            ).first()
            if peticion_pendiente_cliente:
                logger.info(
                    "Cliente %s tiene petición en 'pendiente_cliente': forzando camino '%s' -> 'agendar_cita'",
                    telefono,
                    camino_entrante,
                )
                return Camino.agendar_cita.value

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

        return camino_entrante if camino_entrante in self.handlers else Camino.fallback.value

    @staticmethod
    def _asegurar_y_obtener_cliente(
        session: Session,
        telefono: str,
        nombre_payload: str | None,
    ) -> Cliente:
        ahora_utc = datetime.now(timezone.utc)
        cliente = session.get(Cliente, telefono)
        if not cliente:
            cliente = Cliente(
                telefono=telefono,
                nombre=nombre_payload or "Cliente WhatsApp",
                ultima_interaccion_cliente=ahora_utc,
                estado_conversacion=EstadoConversacion.NORMAL,
                activo=True,
            )
            session.add(cliente)
            session.flush()
            return cliente

        cliente.activo = True
        cliente.ultima_interaccion_cliente = ahora_utc
        if nombre_payload and (not cliente.nombre or cliente.nombre == "Cliente WhatsApp"):
            cliente.nombre = nombre_payload
        session.add(cliente)
        session.flush()
        return cliente

    def process_chat(self, payload: AgentChatRequest, session: Session) -> AgentChatResponse:
        camino_efectivo = payload.camino

        try:
            # 1. Asegurar cliente y verificar si está en pausa esperando atención humana (REQUIERE_HUMANO)
            cliente = self._asegurar_y_obtener_cliente(
                session=session,
                telefono=payload.cliente_telefono,
                nombre_payload=payload.cliente_nombre,
            )

            if cliente.estado_conversacion == EstadoConversacion.REQUIERE_HUMANO:
                logger.info(
                    "Cliente %s en estado REQUIERE_HUMANO: se guarda mensaje en historial sin respuesta del bot.",
                    payload.cliente_telefono,
                )
                self.guardar_mensaje(
                    session=session,
                    session_id=payload.session_id,
                    role="user",
                    content=payload.mensaje,
                    camino="en_espera_humano",
                )
                session.commit()
                return AgentChatResponse(
                    respuesta_texto="",
                    camino=camino_efectivo,
                    accion_ejecutada="silencio_esperando_humano",
                    derivar_a_humano=True,
                    enviar_mensaje_whatsapp=False,
                    metadata={
                        "session_id": payload.session_id,
                        "telefono": payload.cliente_telefono,
                        "bot_pausado": True,
                    },
                )

            # 2. Leer historial previo (DTOs) y resolver continuidad de camino
            historial = self.obtener_historial_reciente(session, payload.session_id, limit=6)
            camino_efectivo = self._resolver_camino_efectivo(
                payload.camino,
                historial,
                session=session,
                telefono=payload.cliente_telefono,
            )

            # 3. Guardar y confirmar de inmediato el turno del cliente (transacción corta).
            # Así el mensaje del cliente nunca se pierde aunque luego falle el proveedor LLM.
            self.guardar_mensaje(
                session=session,
                session_id=payload.session_id,
                role="user",
                content=payload.mensaje,
                camino=camino_efectivo,
            )
            session.commit()

            # 4. Despachar al handler correspondiente
            handler = self.handlers.get(camino_efectivo, self.fallback_handler)
            logger.info(
                "Despachando camino '%s' con %s (%d msgs previos)",
                camino_efectivo,
                handler.__class__.__name__,
                len(historial),
            )
            response = handler.handle(payload, session, historial=historial)

            # 5. Guardar respuesta del asistente y actualizar estado del cliente si requiere humano
            self.guardar_mensaje(
                session=session,
                session_id=payload.session_id,
                role="assistant",
                content=response.respuesta_texto,
                camino=response.camino,
            )

            cliente_post = session.get(Cliente, payload.cliente_telefono)
            if cliente_post:
                ahora_utc = datetime.now(timezone.utc)
                cliente_post.ultimo_mensaje_bot = ahora_utc
                cliente_post.ultima_interaccion_cliente = ahora_utc
                if response.derivar_a_humano:
                    cliente_post.estado_conversacion = EstadoConversacion.REQUIERE_HUMANO
                session.add(cliente_post)

            session.commit()
            return response

        except LLMUnavailableError as exc:
            session.rollback()
            logger.error("Proveedores LLM no disponibles en sesión: %s", str(exc))
            msg_disculpa = (
                "¡Hola! Disculpá, justo tuve un problema técnico momentáneo al consultar el sistema. "
                "En un ratito Maxi te escribe directamente por acá para ayudarte 👌"
            )
            self._guardar_error_y_pausar_seguro(
                session=session,
                session_id=payload.session_id,
                telefono=payload.cliente_telefono,
                respuesta_texto=msg_disculpa,
                camino=camino_efectivo,
            )
            return AgentChatResponse(
                respuesta_texto=msg_disculpa,
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
            msg_disculpa = (
                "¡Hola! Disculpá, justo tuve un problema técnico momentáneo al consultar el sistema. "
                "¿Me podrías reiterar tu consulta o preferís que Maxi te escriba en un ratito? 👌"
            )
            self._guardar_error_y_pausar_seguro(
                session=session,
                session_id=payload.session_id,
                telefono=payload.cliente_telefono,
                respuesta_texto=msg_disculpa,
                camino=camino_efectivo,
            )
            return AgentChatResponse(
                respuesta_texto=msg_disculpa,
                camino=camino_efectivo,
                accion_ejecutada="error_llm",
                derivar_a_humano=True,
                metadata={
                    "session_id": payload.session_id,
                    "error": True,
                },
            )

    @staticmethod
    def _guardar_error_y_pausar_seguro(
        session: Session,
        session_id: str,
        telefono: str,
        respuesta_texto: str,
        camino: str,
    ) -> None:
        """
        En caso de fallo técnico, asegura que:
        1. El cliente pase a REQUIERE_HUMANO.
        2. El mensaje de disculpa quede guardado en agent_chat_messages (visible para Maxi en el CRM).
        """
        try:
            cliente = session.get(Cliente, telefono)
            if cliente:
                cliente.estado_conversacion = EstadoConversacion.REQUIERE_HUMANO
                cliente.ultimo_mensaje_bot = datetime.now(timezone.utc)
                session.add(cliente)

            msg_error = AgentChatMessage(
                session_id=session_id,
                role="assistant",
                content=respuesta_texto,
                camino=camino,
            )
            session.add(msg_error)
            session.commit()
        except Exception:
            session.rollback()
            logger.exception("Fallo al registrar estado de error y mensaje en DB")


@lru_cache
def get_agent_service() -> AgentService:
    """Proveedor de dependencia para inyectar AgentService en FastAPI y facilitar mocks en tests."""
    return AgentService()


agent_service = get_agent_service()
