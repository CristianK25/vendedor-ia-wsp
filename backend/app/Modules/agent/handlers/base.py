from abc import ABC, abstractmethod
from typing import List, Optional
from sqlmodel import Session

from app.Modules.agent.schema import AgentChatRequest, AgentChatResponse
from app.Modules.agent.model import AgentChatMessage

class BaseHandler(ABC):
    """
    Contrato base formal para todos los manejadores de caminos (handlers) del Agente IA.
    
    Cualquier clase que herede de BaseHandler está obligada por Python a implementar
    el método asíncrono 'handle' con esta misma firma de parámetros y retorno.
    """

    @abstractmethod
    async def handle(
        self,
        payload: AgentChatRequest,
        session: Session,
        historial: Optional[List[AgentChatMessage]] = None
    ) -> AgentChatResponse:
        """
        Procesa la petición del cliente y retorna la respuesta lista para n8n / WhatsApp.

        :param payload: Datos recibidos desde n8n (mensaje, cliente, camino, session_id).
        :param session: Sesión activa de base de datos PostgreSQL.
        :param historial: Mensajes previos de la conversación para memoria multi-turno.
        :return: AgentChatResponse con la respuesta final y metadatos.
        """
        pass

