import logging
from typing import List, Optional
from sqlmodel import Session

from app.Modules.clientes.model import Cliente
from app.Modules.agent.handlers.base import BaseHandler
from app.Modules.agent.handlers.catalogo import CatalogoHandler
from app.Modules.agent.llm import LLMClient, llm_client
from app.Modules.agent.prompts import DATOS_VENTA_MAXI, PROMPT_FINANCIACION_TEMPLATE
from app.Modules.agent.schema import (
    AgentChatRequest,
    AgentChatResponse,
    Camino,
    ChatTurn,
    DecisionFinanciacion,
)

logger = logging.getLogger("agent.financiacion")


class FinanciacionHandler(BaseHandler):
    """Manejador especializado en el camino 'financiacion' (formas de pago, dólares y créditos)."""

    def __init__(self, llm: LLMClient = llm_client):
        self.llm = llm

    @staticmethod
    def _obtener_nombre_cliente(session: Session, telefono: str, nombre_payload: Optional[str]) -> str:
        cliente = session.get(Cliente, telefono)
        return (
            (cliente.nombre if cliente and cliente.nombre else None)
            or nombre_payload
            or "No informado aún"
        )

    @staticmethod
    def _actualizar_nombre_si_corresponde(
        session: Session,
        telefono: str,
        nombre_detectado: Optional[str],
    ) -> None:
        if not nombre_detectado:
            return
        limpio = nombre_detectado.strip()
        if not limpio or limpio.lower() in {"null", "none", "n/a", "no informado aún", "cliente whatsapp"}:
            return
        cliente = session.get(Cliente, telefono)
        if cliente and (not cliente.nombre or cliente.nombre == "Cliente WhatsApp"):
            cliente.nombre = limpio
            session.add(cliente)

    def handle(
        self,
        payload: AgentChatRequest,
        session: Session,
        historial: Optional[List[ChatTurn]] = None,
    ) -> AgentChatResponse:
        """Procesa consultas de financiación y medios de pago siguiendo las reglas de Maxi."""
        stock_texto, ids_validos = CatalogoHandler.obtener_stock_resumen(session)
        nombre_registrado = self._obtener_nombre_cliente(
            session=session,
            telefono=payload.cliente_telefono,
            nombre_payload=payload.cliente_nombre,
        )
        # Cerrar transacción de lectura antes de la llamada HTTP al LLM
        session.commit()

        system_prompt = PROMPT_FINANCIACION_TEMPLATE.format(
            datos_venta=DATOS_VENTA_MAXI,
            cliente_nombre=nombre_registrado,
            stock_actual=stock_texto,
        )

        decision = self.llm.generar_estructurado(
            schema_cls=DecisionFinanciacion,
            system_prompt=system_prompt,
            user_message=payload.mensaje,
            historial=historial,
        )

        vehiculo_id = decision.vehiculo_interes_id
        if vehiculo_id is not None and vehiculo_id not in ids_validos:
            logger.warning(
                "El LLM devolvió un vehiculo_interes_id (%s) fuera del stock activo en financiación; se descarta.",
                vehiculo_id,
            )
            vehiculo_id = None

        self._actualizar_nombre_si_corresponde(
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

        accion = "financiacion_derivada" if decision.derivar_a_maxi else "info_financiacion"

        return AgentChatResponse(
            respuesta_texto=decision.respuesta_whatsapp,
            camino=Camino.financiacion.value,
            accion_ejecutada=accion,
            derivar_a_humano=decision.derivar_a_maxi,
            metadata={
                "vehiculo_interes_id": vehiculo_id,
                "monto_entrega_ofrecido": decision.monto_entrega_ofrecido,
                "session_id": payload.session_id,
                "telefono": payload.cliente_telefono,
            },
        )
