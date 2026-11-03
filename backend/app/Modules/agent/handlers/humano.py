import logging
from typing import List, Optional
from sqlmodel import Session

from app.Modules.clientes.model import Cliente
from app.Modules.agent.handlers.base import BaseHandler
from app.Modules.agent.schema import AgentChatRequest, AgentChatResponse, Camino, ChatTurn

logger = logging.getLogger("agent.humano")


class HumanoHandler(BaseHandler):
    """Manejador para cuando el cliente solicita hablar con Maxi, quiere señar/cerrar o tiene un reclamo."""

    def handle(
        self,
        payload: AgentChatRequest,
        session: Session,
        historial: Optional[List[ChatTurn]] = None,
    ) -> AgentChatResponse:
        cliente = session.get(Cliente, payload.cliente_telefono)
        nombre_db = (
            cliente.nombre
            if cliente and cliente.nombre and cliente.nombre != "Cliente WhatsApp"
            else None
        )
        nombre_efectivo = nombre_db or (
            payload.cliente_nombre
            if payload.cliente_nombre and payload.cliente_nombre != "Cliente WhatsApp"
            else None
        )

        if nombre_efectivo:
            respuesta = (
                f"Perfecto {nombre_efectivo}, en un rato te escribo personalmente para verlo bien 👌"
            )
        else:
            respuesta = (
                "Perfecto, en un rato te escribo personalmente para verlo bien 👌 ¿Me pasás tu nombre?"
            )

        return AgentChatResponse(
            respuesta_texto=respuesta,
            camino=Camino.humano.value,
            accion_ejecutada="handoff_humano",
            derivar_a_humano=True,
            metadata={
                "session_id": payload.session_id,
                "telefono": payload.cliente_telefono,
            },
        )
