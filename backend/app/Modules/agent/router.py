import logging
from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.Core.database import get_session
from app.Core.Security.deps import verify_n8n_internal_request
from app.Modules.agent.schema import AgentChatRequest, AgentChatResponse
from app.Modules.agent.service import agent_service

logger = logging.getLogger("agent.router")

router = APIRouter(
    prefix="/agent",
    tags=["Agent IA"],
    dependencies=[Depends(verify_n8n_internal_request)]
)

@router.post("/chat", response_model=AgentChatResponse, status_code=status.HTTP_200_OK)
async def chat_agent(
    payload: AgentChatRequest,
    session: Session = Depends(get_session)
):
    """
    Endpoint invocado por n8n ('Ejecutar Agente') con cabecera X-N8N-API-KEY.
    Despacha la consulta al handler modular del camino correspondiente (catálogo, etc.)
    """
    return await agent_service.process_chat(payload, session)
