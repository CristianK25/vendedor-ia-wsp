from typing import List, Optional
from sqlmodel import Session

from app.Modules.agent.handlers.base import BaseHandler
from app.Modules.agent.handlers.fallback import FallbackHandler
from app.Modules.agent.schema import AgentChatRequest, AgentChatResponse, ChatTurn


class TasacionHandler(BaseHandler):
    """Stub inicial para el camino de Tasación (delega temporalmente a FallbackHandler)."""

    def __init__(self):
        self._fallback = FallbackHandler()

    def handle(
        self,
        payload: AgentChatRequest,
        session: Session,
        historial: Optional[List[ChatTurn]] = None,
    ) -> AgentChatResponse:
        return self._fallback.handle(payload, session, historial=historial)

