from abc import ABC, abstractmethod
from typing import List, Optional
from sqlmodel import Session

from app.Modules.agent.schema import AgentChatRequest, AgentChatResponse, ChatTurn


class BaseHandler(ABC):
    """
    Contrato base formal para todos los manejadores de caminos (handlers) del Agente IA.

    Cualquier clase que herede de BaseHandler debe implementar el método síncrono 'handle'
    (FastAPI lo ejecuta en el threadpool para no bloquear el event loop).
    """

    @abstractmethod
    def handle(
        self,
        payload: AgentChatRequest,
        session: Session,
        historial: Optional[List[ChatTurn]] = None,
    ) -> AgentChatResponse:
        """
        Procesa la petición del cliente y retorna la respuesta lista para n8n / WhatsApp.

        :param payload: Datos recibidos y saneados desde n8n (mensaje, cliente, camino, session_id).
        :param session: Sesión activa de base de datos PostgreSQL.
        :param historial: DTOs de mensajes previos de la conversación para memoria multi-turno.
        :return: AgentChatResponse con la respuesta final y metadatos.
        """
        pass
