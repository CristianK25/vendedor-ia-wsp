from datetime import datetime, timedelta, timezone
import logging
from typing import List, Optional, Tuple
from zoneinfo import ZoneInfo
from sqlmodel import Session, select

from app.Modules.citas.model import Cita
from app.Modules.clientes.model import Cliente
from app.Modules.peticiones.model import Peticion
from app.Modules.agent.handlers.base import BaseHandler
from app.Modules.agent.handlers.catalogo import CatalogoHandler
from app.Modules.agent.llm import LLMClient, llm_client
from app.Modules.agent.prompts import DATOS_VENTA_MAXI, PROMPT_PETICION_TEMPLATE
from app.Modules.agent.schema import (
    AgentChatRequest,
    AgentChatResponse,
    Camino,
    ChatTurn,
    DecisionPeticion,
)

logger = logging.getLogger("agent.peticion")

DIAS_SEMANA = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
]

MENDOZA_TZ = ZoneInfo("America/Argentina/Mendoza")


class PeticionHandler(BaseHandler):
    """Manejador especializado en el camino 'agendar_cita' / 'peticion' conectado a la tabla peticiones."""

    def __init__(self, llm: LLMClient = llm_client):
        self.llm = llm

    @staticmethod
    def _construir_referencia_calendario() -> Tuple[str, str]:
        """Genera la fecha/hora actual en Mendoza y la tabla de los próximos 7 días para el prompt."""
        ahora = datetime.now(MENDOZA_TZ)
        dia_nombre = DIAS_SEMANA[ahora.weekday()]
        fecha_actual_texto = f"{dia_nombre} {ahora.strftime('%d/%m/%Y %H:%M')} hs"

        lineas_cal: list[str] = []
        for delta in range(8):
            dt = ahora + timedelta(days=delta)
            nombre = DIAS_SEMANA[dt.weekday()]
            etiqueta = " (HOY)" if delta == 0 else (" (MAÑANA)" if delta == 1 else "")
            lineas_cal.append(f"- {nombre}{etiqueta}: {dt.strftime('%Y-%m-%d')} ({dt.strftime('%d/%m/%Y')})")

        return fecha_actual_texto, "\n".join(lineas_cal)

    @staticmethod
    def _obtener_contexto_cliente_y_citas(
        session: Session,
        telefono: str,
        nombre_payload: Optional[str],
    ) -> Tuple[str, str]:
        """Recupera el nombre del cliente y si ya tiene citas o peticiones pendientes en DB."""
        cliente = session.get(Cliente, telefono)
        nombre_registrado = (
            (cliente.nombre if cliente and cliente.nombre else None)
            or nombre_payload
            or "No informado aún"
        )

        ahora_utc = datetime.now(timezone.utc)
        cita_activa = session.exec(
            select(Cita)
            .where(
                Cita.cliente_telefono == telefono,
                Cita.estado == "confirmada",
                Cita.fecha >= ahora_utc,
            )
            .order_by(Cita.fecha.asc())
        ).first()

        peticion_pendiente = session.exec(
            select(Peticion)
            .where(
                Peticion.cliente_telefono == telefono,
                Peticion.estado.in_(["pendiente_admin", "pendiente_cliente"]),
            )
            .order_by(Peticion.fecha_propuesta.asc())
        ).first()

        partes: list[str] = []
        if cita_activa:
            partes.append(
                f"Tiene una cita confirmada para el {cita_activa.fecha.strftime('%d/%m/%Y a las %H:%M')} hs"
            )
        if peticion_pendiente:
            auto_txt = peticion_pendiente.vehiculo_modelo or "Consulta general"
            partes.append(
                f"Tiene una solicitud pendiente de confirmar para el {peticion_pendiente.fecha_propuesta.strftime('%d/%m/%Y a las %H:%M')} hs (Vehículo: {auto_txt})"
            )

        estado_texto = "; ".join(partes) if partes else "Ninguna cita ni petición activa."
        return nombre_registrado, estado_texto

    @staticmethod
    def _parsear_fecha_propuesta(fecha_iso: Optional[str]) -> Optional[datetime]:
        """
        Convierte el string ISO devuelto por el LLM en un datetime con timezone.utc
        preservando la hora local de Mendoza para compatibilidad con CalendarPage y public_router.
        """
        if not fecha_iso:
            return None
        limpio = fecha_iso.strip()
        if not limpio or limpio.lower() in {"null", "none"}:
            return None
        try:
            # Si viene con sufijo Z, lo quitamos antes de parsear para preservar la hora nominal
            if limpio.endswith("Z"):
                limpio = limpio[:-1]
            dt = datetime.fromisoformat(limpio)
            # Preservamos la hora nominal en UTC para que PostgreSQL TIMESTAMP WITHOUT TIME ZONE
            # guarde exactamente la hora local acordada con el cliente en Mendoza.
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            logger.warning("No se pudo parsear fecha_hora_iso devuelta por el LLM: '%s'", fecha_iso)
            return None

    @staticmethod
    def _guardar_o_actualizar_peticion(
        session: Session,
        telefono: str,
        nombre_cliente: str,
        vehiculo_modelo: Optional[str],
        fecha_propuesta: datetime,
    ) -> Peticion:
        """Crea o actualiza una petición pendiente_admin en la tabla `peticiones`."""
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

        vehiculo_limpio = vehiculo_modelo.strip() if vehiculo_modelo else None
        if vehiculo_limpio and vehiculo_limpio.lower() in {"null", "none", "n/a", ""}:
            vehiculo_limpio = None

        stmt = select(Peticion).where(
            Peticion.cliente_telefono == telefono,
            Peticion.estado == "pendiente_admin",
        )
        peticion_existente = session.exec(stmt).first()

        if peticion_existente:
            peticion_existente.cliente_nombre = nombre_cliente
            if vehiculo_limpio:
                peticion_existente.vehiculo_modelo = vehiculo_limpio
            peticion_existente.fecha_propuesta = fecha_propuesta
            session.add(peticion_existente)
            session.flush()
            return peticion_existente

        nueva_peticion = Peticion(
            cliente_nombre=nombre_cliente,
            cliente_telefono=telefono,
            vehiculo_modelo=vehiculo_limpio,
            fecha_propuesta=fecha_propuesta,
            origen="cliente",
            estado="pendiente_admin",
        )
        session.add(nueva_peticion)
        session.flush()
        return nueva_peticion

    def handle(
        self,
        payload: AgentChatRequest,
        session: Session,
        historial: Optional[List[ChatTurn]] = None,
    ) -> AgentChatResponse:
        """Procesa solicitudes de visita / agendamiento de citas y persiste en la tabla `peticiones`."""
        stock_texto, _ = CatalogoHandler.obtener_stock_resumen(session)
        nombre_registrado, estado_citas_previas = self._obtener_contexto_cliente_y_citas(
            session=session,
            telefono=payload.cliente_telefono,
            nombre_payload=payload.cliente_nombre,
        )
        # Cerrar transacción de lectura antes de invocar al LLM
        session.commit()

        fecha_actual_texto, calendario_proximos_dias = self._construir_referencia_calendario()

        system_prompt = PROMPT_PETICION_TEMPLATE.format(
            datos_venta=DATOS_VENTA_MAXI,
            fecha_actual_texto=fecha_actual_texto,
            calendario_proximos_dias=calendario_proximos_dias,
            cliente_nombre=nombre_registrado,
            estado_citas_previas=estado_citas_previas,
            stock_actual=stock_texto,
        )

        decision = self.llm.generar_estructurado(
            schema_cls=DecisionPeticion,
            system_prompt=system_prompt,
            user_message=payload.mensaje,
            historial=historial,
        )

        fecha_dt = self._parsear_fecha_propuesta(decision.fecha_hora_iso)
        nombre_final = (
            decision.cliente_nombre_detectado
            or payload.cliente_nombre
            or (nombre_registrado if nombre_registrado != "No informado aún" else "Cliente WhatsApp")
        )

        peticion_id: Optional[int] = None
        accion = "solicitar_horario_cita"

        if decision.confirmar_peticion and fecha_dt is not None:
            peticion = self._guardar_o_actualizar_peticion(
                session=session,
                telefono=payload.cliente_telefono,
                nombre_cliente=nombre_final,
                vehiculo_modelo=decision.vehiculo_modelo,
                fecha_propuesta=fecha_dt,
            )
            peticion_id = peticion.id
            accion = "peticion_creada"
            logger.info(
                "Petición de cita registrada en DB (ID: %s | Auto: %s | Fecha: %s)",
                peticion_id,
                peticion.vehiculo_modelo,
                fecha_dt.isoformat(),
            )
        elif decision.derivar_a_maxi:
            accion = "derivado_humano"

        return AgentChatResponse(
            respuesta_texto=decision.respuesta_whatsapp,
            camino=Camino.agendar_cita.value,
            accion_ejecutada=accion,
            derivar_a_humano=decision.derivar_a_maxi,
            metadata={
                "peticion_id": peticion_id,
                "vehiculo_modelo": decision.vehiculo_modelo,
                "fecha_propuesta": fecha_dt.isoformat() if fecha_dt else None,
                "confirmar_peticion": bool(decision.confirmar_peticion and fecha_dt is not None),
                "session_id": payload.session_id,
                "telefono": payload.cliente_telefono,
            },
        )
