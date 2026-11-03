import logging
from typing import List, Optional
from sqlmodel import Session

from app.Modules.agent.handlers.base import BaseHandler
from app.Modules.agent.handlers.catalogo import CatalogoHandler
from app.Modules.agent.handlers.financiacion import FinanciacionHandler
from app.Modules.agent.llm import LLMClient, llm_client
from app.Modules.agent.prompts import DATOS_VENTA_MAXI, PROMPT_GENERAL_TEMPLATE
from app.Modules.agent.schema import (
    AgentChatRequest,
    AgentChatResponse,
    Camino,
    ChatTurn,
    DecisionGeneral,
)

logger = logging.getLogger("agent.fallback")


class FallbackHandler(BaseHandler):
    """Manejador conversacional para el camino 'general' / 'fallback' (saludos, horarios y consultas abiertas)."""

    def __init__(self, llm: LLMClient = llm_client):
        self.llm = llm

    def handle(
        self,
        payload: AgentChatRequest,
        session: Session,
        historial: Optional[List[ChatTurn]] = None,
    ) -> AgentChatResponse:
        stock_texto, _ = CatalogoHandler.obtener_stock_resumen(session)
        nombre_registrado = FinanciacionHandler._obtener_nombre_cliente(
            session=session,
            telefono=payload.cliente_telefono,
            nombre_payload=payload.cliente_nombre,
        )
        # Cerrar transacción de lectura antes de la llamada HTTP al LLM
        session.commit()

        system_prompt = PROMPT_GENERAL_TEMPLATE.format(
            datos_venta=DATOS_VENTA_MAXI,
            cliente_nombre=nombre_registrado,
            stock_actual=stock_texto,
        )

        decision = self.llm.generar_estructurado(
            schema_cls=DecisionGeneral,
            system_prompt=system_prompt,
            user_message=payload.mensaje,
            historial=historial,
        )

        FinanciacionHandler._actualizar_nombre_si_corresponde(
            session=session,
            telefono=payload.cliente_telefono,
            nombre_detectado=decision.cliente_nombre_detectado,
        )

        accion = "derivado_humano" if decision.derivar_a_maxi else "consulta_general"

        return AgentChatResponse(
            respuesta_texto=decision.respuesta_whatsapp,
            camino=Camino.general.value,
            accion_ejecutada=accion,
            derivar_a_humano=decision.derivar_a_maxi,
            metadata={
                "session_id": payload.session_id,
                "telefono": payload.cliente_telefono,
            },
        )
