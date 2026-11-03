from datetime import datetime, timezone
import logging
from typing import List, Optional, Tuple
from sqlmodel import Session, select

from app.Modules.clientes.model import Cliente
from app.Modules.interacciones.model import Interaccion, TipoIntencion
from app.Modules.agent.handlers.base import BaseHandler
from app.Modules.agent.handlers.catalogo import CatalogoHandler
from app.Modules.agent.llm import LLMClient, llm_client
from app.Modules.agent.prompts import DATOS_VENTA_MAXI, PROMPT_TASACION_TEMPLATE
from app.Modules.agent.schema import (
    AgentChatRequest,
    AgentChatResponse,
    Camino,
    ChatTurn,
    DecisionTasacion,
)

logger = logging.getLogger("agent.tasacion")


class TasacionHandler(BaseHandler):
    """Manejador especializado en el camino 'tasacion' (toma de usados / permuta)."""

    def __init__(self, llm: LLMClient = llm_client):
        self.llm = llm

    @staticmethod
    def _limpiar_texto(valor: Optional[str]) -> Optional[str]:
        if not valor:
            return None
        limpio = valor.strip()
        if limpio.lower() in {"null", "none", "n/a", ""}:
            return None
        return limpio

    @staticmethod
    def _obtener_contexto_cliente_y_tasacion(
        session: Session,
        telefono: str,
        nombre_payload: Optional[str],
    ) -> Tuple[str, str]:
        """Recupera el nombre registrado del cliente y si ya tiene datos de tasación previos."""
        cliente = session.get(Cliente, telefono)
        nombre_registrado = (
            (cliente.nombre if cliente and cliente.nombre else None)
            or nombre_payload
            or "No informado aún"
        )

        tasacion_existente = session.exec(
            select(Interaccion)
            .where(
                Interaccion.cliente_telefono == telefono,
                Interaccion.tipo == TipoIntencion.venta_tasacion,
                Interaccion.seguimiento_completado.is_(False),
            )
            .order_by(Interaccion.id.desc())
        ).first()

        if not tasacion_existente:
            return nombre_registrado, "Ningún auto usado registrado aún."

        partes: list[str] = []
        if tasacion_existente.vehiculo_modelo_tasacion:
            partes.append(f"Auto ofrecido: {tasacion_existente.vehiculo_modelo_tasacion}")
        if tasacion_existente.detalles_tasacion:
            partes.append(f"Detalles: {tasacion_existente.detalles_tasacion}")
        if tasacion_existente.precio_pretendido is not None:
            partes.append(f"Precio pretendido: ${tasacion_existente.precio_pretendido:,.0f}")

        resumen_previo = " | ".join(partes) if partes else "Consulta de permuta iniciada sin datos del auto aún."
        return nombre_registrado, resumen_previo

    @staticmethod
    def _guardar_o_actualizar_tasacion(
        session: Session,
        telefono: str,
        nombre_cliente: str,
        vehiculo_id: Optional[int],
        vehiculo_modelo_tasacion: Optional[str],
        precio_pretendido: Optional[float],
        detalles_tasacion: Optional[str],
    ) -> Interaccion:
        """
        Asegura que el cliente exista en `clientes` y crea o actualiza la interacción
        activa de tipo `venta_tasacion` en la tabla `interacciones`.
        """
        cliente = session.get(Cliente, telefono)
        if not cliente:
            cliente = Cliente(
                telefono=telefono,
                nombre=nombre_cliente,
                activo=True,
            )
            session.add(cliente)
            session.flush()
        elif nombre_cliente and nombre_cliente not in {"Cliente WhatsApp", "No informado aún"}:
            if not cliente.nombre or cliente.nombre == "Cliente WhatsApp":
                cliente.nombre = nombre_cliente
                session.add(cliente)

        interaccion_existente = session.exec(
            select(Interaccion)
            .where(
                Interaccion.cliente_telefono == telefono,
                Interaccion.tipo == TipoIntencion.venta_tasacion,
                Interaccion.seguimiento_completado.is_(False),
            )
            .order_by(Interaccion.id.desc())
        ).first()

        if interaccion_existente:
            if vehiculo_id is not None:
                interaccion_existente.vehiculo_id = vehiculo_id
            if vehiculo_modelo_tasacion:
                interaccion_existente.vehiculo_modelo_tasacion = vehiculo_modelo_tasacion
            if precio_pretendido is not None:
                interaccion_existente.precio_pretendido = precio_pretendido
            if detalles_tasacion:
                interaccion_existente.detalles_tasacion = detalles_tasacion
            interaccion_existente.fecha = datetime.now(timezone.utc)
            interaccion_existente.respondido = True
            session.add(interaccion_existente)
            session.flush()
            return interaccion_existente

        nueva_interaccion = Interaccion(
            cliente_telefono=telefono,
            vehiculo_id=vehiculo_id,
            tipo=TipoIntencion.venta_tasacion,
            vehiculo_modelo_tasacion=vehiculo_modelo_tasacion,
            precio_pretendido=precio_pretendido,
            detalles_tasacion=detalles_tasacion,
            fecha=datetime.now(timezone.utc),
            respondido=True,
            seguimiento_completado=False,
        )
        session.add(nueva_interaccion)
        session.flush()
        return nueva_interaccion

    def handle(
        self,
        payload: AgentChatRequest,
        session: Session,
        historial: Optional[List[ChatTurn]] = None,
    ) -> AgentChatResponse:
        """Procesa consultas de permuta/tasación de usados y registra los datos en `interacciones`."""
        stock_texto, ids_validos = CatalogoHandler.obtener_stock_resumen(session)
        nombre_registrado, tasacion_previa = self._obtener_contexto_cliente_y_tasacion(
            session=session,
            telefono=payload.cliente_telefono,
            nombre_payload=payload.cliente_nombre,
        )
        # Cerrar transacción de lectura antes de la llamada HTTP al LLM
        session.commit()

        system_prompt = PROMPT_TASACION_TEMPLATE.format(
            datos_venta=DATOS_VENTA_MAXI,
            cliente_nombre=nombre_registrado,
            tasacion_previa=tasacion_previa,
            stock_actual=stock_texto,
        )

        decision = self.llm.generar_estructurado(
            schema_cls=DecisionTasacion,
            system_prompt=system_prompt,
            user_message=payload.mensaje,
            historial=historial,
        )

        vehiculo_id = decision.vehiculo_interes_id
        if vehiculo_id is not None and vehiculo_id not in ids_validos:
            logger.warning(
                "El LLM devolvió un vehiculo_interes_id (%s) fuera del stock activo en tasación; se descarta.",
                vehiculo_id,
            )
            vehiculo_id = None

        modelo_usado = self._limpiar_texto(decision.vehiculo_modelo_tasacion)
        km_usado = self._limpiar_texto(decision.kilometraje_tasacion)
        detalles_raw = self._limpiar_texto(decision.detalles_tasacion)
        nombre_detectado = self._limpiar_texto(decision.cliente_nombre_detectado)

        partes_detalles: list[str] = []
        if km_usado and (not detalles_raw or km_usado.lower() not in detalles_raw.lower()):
            partes_detalles.append(f"Km: {km_usado}")
        if detalles_raw:
            partes_detalles.append(detalles_raw)
        detalles_final = " | ".join(partes_detalles) if partes_detalles else None

        nombre_final = (
            nombre_detectado
            or payload.cliente_nombre
            or (nombre_registrado if nombre_registrado != "No informado aún" else "Cliente WhatsApp")
        )

        interaccion_id: Optional[int] = None
        # Guardamos o actualizamos en `interacciones` apenas tengamos al menos el modelo del usado o los datos completos
        if modelo_usado or decision.datos_usado_completos:
            interaccion = self._guardar_o_actualizar_tasacion(
                session=session,
                telefono=payload.cliente_telefono,
                nombre_cliente=nombre_final,
                vehiculo_id=vehiculo_id,
                vehiculo_modelo_tasacion=modelo_usado,
                precio_pretendido=decision.precio_pretendido,
                detalles_tasacion=detalles_final,
            )
            interaccion_id = interaccion.id
            logger.info(
                "Tasación registrada/actualizada en DB (Interaccion ID: %s | Usado: %s | Detalles: %s | Completo: %s)",
                interaccion_id,
                interaccion.vehiculo_modelo_tasacion,
                interaccion.detalles_tasacion,
                decision.datos_usado_completos,
            )

        derivar_a_humano = bool(decision.datos_usado_completos or decision.derivar_a_maxi)
        if decision.datos_usado_completos:
            accion = "tasacion_registrada"
        elif decision.derivar_a_maxi:
            accion = "derivado_humano"
        else:
            accion = "solicitar_datos_tasacion"

        return AgentChatResponse(
            respuesta_texto=decision.respuesta_whatsapp,
            camino=Camino.tasacion.value,
            accion_ejecutada=accion,
            derivar_a_humano=derivar_a_humano,
            metadata={
                "interaccion_id": interaccion_id,
                "vehiculo_modelo_tasacion": modelo_usado,
                "kilometraje_tasacion": km_usado,
                "precio_pretendido": decision.precio_pretendido,
                "detalles_tasacion": detalles_final,
                "vehiculo_interes_id": vehiculo_id,
                "datos_usado_completos": decision.datos_usado_completos,
                "session_id": payload.session_id,
                "telefono": payload.cliente_telefono,
            },
        )
