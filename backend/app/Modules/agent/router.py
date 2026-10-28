import logging
from fastapi import APIRouter, Depends, status
from app.Core.Security.deps import verify_n8n_internal_request
from app.Modules.agent.schema import AgentChatRequest, AgentChatResponse

logger = logging.getLogger("agent")

router = APIRouter(
    prefix="/agent",
    tags=["Agent IA"],
    dependencies=[Depends(verify_n8n_internal_request)]
)

@router.post("/chat", response_model=AgentChatResponse, status_code=status.HTTP_200_OK)
async def chat_agent(payload: AgentChatRequest):
    """
    Endpoint invocado por n8n ('Ejecutar Agente') con cabecera X-N8N-API-KEY.
    Recibe el mensaje del cliente, teléfono y la intención clasificada por Laya.
    """
    logger.info(f"Agente invocado para camino: {payload.camino} - Tel: {payload.cliente_telefono}")

    # Respuesta inicial estructurada para probar el canal de comunicación con n8n
    respuesta = (
        f"Hola {payload.cliente_nombre or ''}, hemos recibido tu consulta sobre {payload.camino}: "
        f"\"{payload.mensaje}\". (Backend Agent activo)"
    ).strip()

    return AgentChatResponse(
        respuesta_texto=respuesta,
        camino=payload.camino,
        accion_ejecutada="eco_inicial",
        derivar_a_humano=(payload.camino == "humano"),
        metadata={
            "session_id": payload.session_id,
            "telefono": payload.cliente_telefono
        }
    )
