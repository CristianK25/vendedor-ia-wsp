import logging
from typing import List, Optional
from sqlmodel import Session

from app.Modules.agent.handlers.base import BaseHandler
from app.Modules.agent.handlers.catalogo import CatalogoHandler
from app.Modules.agent.handlers.financiacion import FinanciacionHandler
from app.Modules.agent.llm import LLMClient, llm_client
from app.Modules.agent.prompts import DATOS_VENTA_MAXI, PROMPT_NEGOCIACION_TEMPLATE
from app.Modules.agent.schema import (
    AgentChatRequest,
    AgentChatResponse,
    Camino,
    ChatTurn,
    DecisionNegociacion,
)

logger = logging.getLogger("agent.negociacion")


class NegociacionHandler(BaseHandler):
    """Manejador especializado en el camino 'negociacion' (ofertas de contado / pedidos de descuento)."""

    def __init__(self, llm: LLMClient = llm_client):
        self.llm = llm

    def handle(
        self,
        payload: AgentChatRequest,
        session: Session,
        historial: Optional[List[ChatTurn]] = None,
    ) -> AgentChatResponse:
        """
        Procesa ofertas de contado o pedidos de descuento aplicando la regla de Maxi:
        'El precio final lo charlamos cuando lo veas' y derivando siempre a atención humana.
        """
        stock_texto, ids_validos = CatalogoHandler.obtener_stock_resumen(session)
        nombre_registrado = FinanciacionHandler._obtener_nombre_cliente(
            session=session,
            telefono=payload.cliente_telefono,
            nombre_payload=payload.cliente_nombre,
        )
        # Cerrar transacción de lectura antes de la llamada HTTP al LLM
        session.commit()

        system_prompt = PROMPT_NEGOCIACION_TEMPLATE.format(
            datos_venta=DATOS_VENTA_MAXI,
            cliente_nombre=nombre_registrado,
            stock_actual=stock_texto,
        )

        decision = self.llm.generar_estructurado(
            schema_cls=DecisionNegociacion,
            system_prompt=system_prompt,
            user_message=payload.mensaje,
            historial=historial,
        )

        vehiculo_id = decision.vehiculo_interes_id
        if vehiculo_id is not None and vehiculo_id not in ids_validos:
            logger.warning(
                "El LLM devolvió un vehiculo_interes_id (%s) fuera del stock activo en negociación; se descarta.",
                vehiculo_id,
            )
            vehiculo_id = None

        FinanciacionHandler._actualizar_nombre_si_corresponde(
            session=session,
            telefono=payload.cliente_telefono,
            nombre_detectado=decision.cliente_nombre_detectado,
        )

        if vehiculo_id is not None:
            CatalogoHandler._registrar_interes_vehiculo(
                session=session,
                cliente_telefono=payload.cliente_telefono,
                cliente_nombre=decision.cliente_nombre_detectado or payload.cliente_nombre,
                vehiculo_id=vehiculo_id,
            )

        return AgentChatResponse(
            respuesta_texto=decision.respuesta_whatsapp,
            camino=Camino.negociacion.value,
            accion_ejecutada="negociacion_derivada",
            # En negociación siempre derivamos a Maxi según la regla de negocio
            derivar_a_humano=True,
            metadata={
                "vehiculo_interes_id": vehiculo_id,
                "oferta_cliente": decision.oferta_cliente,
                "session_id": payload.session_id,
                "telefono": payload.cliente_telefono,
            },
        )
