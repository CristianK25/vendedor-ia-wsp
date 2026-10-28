import logging
from sqlmodel import Session

from app.Modules.agent.schema import AgentChatRequest, AgentChatResponse
from app.Modules.agent.handlers.catalogo import CatalogoHandler
from app.Modules.agent.handlers.humano import HumanoHandler
from app.Modules.agent.handlers.fallback import FallbackHandler

logger = logging.getLogger("agent.service")

class AgentService:
    """Orquestador principal y despachador de caminos del Agente IA."""

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

    async def process_chat(self, payload: AgentChatRequest, session: Session) -> AgentChatResponse:
        # Sanitizar posibles signos '=' de expresiones de n8n
        camino = payload.camino.lstrip("=").strip().lower()

        handler = self.handlers.get(camino, self.fallback_handler)
        logger.info(f"Despachando consulta para camino: '{camino}' usando {handler.__class__.__name__}")

        return await handler.handle(payload, session)

# Instancia singleton para uso en el router
agent_service = AgentService()

