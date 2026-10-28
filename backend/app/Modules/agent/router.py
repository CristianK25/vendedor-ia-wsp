import logging
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.Core.database import get_session
from app.Core.Security.deps import verify_n8n_internal_request
from app.Modules.agent.schema import AgentChatRequest, AgentChatResponse
from app.Modules.agent.service import AgentService, get_agent_service

logger = logging.getLogger("agent.router")

router = APIRouter(
    prefix="/agent",
    tags=["Agent IA"],
    dependencies=[Depends(verify_n8n_internal_request)],
)


def _mask_phone(phone: str) -> str:
    """Enmascara el teléfono en logs para proteger PII (deja visibles solo los últimos 4 dígitos)."""
    cleaned = phone.strip()
    if len(cleaned) <= 4:
        return "****"
    return f"***{cleaned[-4:]}"


@router.post("/chat", response_model=AgentChatResponse)
def chat_agent(
    payload: AgentChatRequest,
    session: Annotated[Session, Depends(get_session)],
    service: Annotated[AgentService, Depends(get_agent_service)],
) -> AgentChatResponse:
    """
    Endpoint invocado por n8n ('Ejecutar Agente') con cabecera X-N8N-API-KEY.
    Se define como función síncrona ('def') para que FastAPI la ejecute en el threadpool
    sin bloquear el event loop durante llamadas a la base de datos o al LLM.
    """
    logger.info(
        "Petición n8n recibida - Tel: %s | Camino entrante: %s",
        _mask_phone(payload.cliente_telefono),
        payload.camino,
    )
    return service.process_chat(payload, session)
