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
            dt_cita_utc = (
                cita_activa.fecha.replace(tzinfo=timezone.utc)
                if cita_activa.fecha.tzinfo is None
                else cita_activa.fecha
            )
            dt_cita_mza = dt_cita_utc.astimezone(MENDOZA_TZ)
            partes.append(
                f"Tiene una cita confirmada para el {dt_cita_mza.strftime('%d/%m/%Y a las %H:%M')} hs"
            )
        if peticion_pendiente:
            dt_pet_utc = (
                peticion_pendiente.fecha_propuesta.replace(tzinfo=timezone.utc)
                if peticion_pendiente.fecha_propuesta.tzinfo is None
                else peticion_pendiente.fecha_propuesta
            )
            dt_pet_mza = dt_pet_utc.astimezone(MENDOZA_TZ)
            auto_txt = peticion_pendiente.vehiculo_modelo or "Consulta general"
            if peticion_pendiente.estado == "pendiente_cliente":
                partes.append(
                    f"Maxi le propuso reprogramar la visita para el {dt_pet_mza.strftime('%d/%m/%Y a las %H:%M')} hs "
                    f"(Vehículo: {auto_txt}) y estamos esperando que el cliente confirme si acepta ese horario "
                    f"o proponga otro."
                )
            else:
                partes.append(
                    f"Tiene una solicitud enviada por el cliente pendiente de confirmar para el "
                    f"{dt_pet_mza.strftime('%d/%m/%Y a las %H:%M')} hs (Vehículo: {auto_txt})"
                )

        estado_texto = "; ".join(partes) if partes else "Ninguna cita ni petición activa."
        return nombre_registrado, estado_texto

    @staticmethod
    def _parsear_fecha_propuesta(fecha_iso: Optional[str]) -> Optional[datetime]:
        """
        Convierte el string ISO devuelto por el LLM (calculado en hora local de Mendoza)
        a un datetime en UTC para que al serializarse en JSON y formatearse en el frontend
        (o en cualquier cliente con zona horaria de Argentina) coincida exactamente con
        la hora acordada con el cliente.
        """
        if not fecha_iso:
            return None
        limpio = fecha_iso.strip()
        if not limpio or limpio.lower() in {"null", "none"}:
            return None
        try:
            # Si viene con sufijo Z u offset, lo removemos para interpretar la hora nominal como local de Mendoza
            if limpio.endswith("Z"):
                limpio = limpio[:-1]
            dt = datetime.fromisoformat(limpio)
            # La hora nominal representa la hora acordada en Mendoza (America/Argentina/Mendoza, UTC-3)
            dt_mendoza = dt.replace(tzinfo=MENDOZA_TZ)
            # Guardamos en UTC (+00:00) para compatibilidad con ISO 8601 y Date() en frontend
            return dt_mendoza.astimezone(timezone.utc)
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

        stmt_cliente = select(Peticion).where(
            Peticion.cliente_telefono == telefono,
            Peticion.estado == "pendiente_cliente",
        )
        peticion_propuesta_admin = session.exec(stmt_cliente).first()

        if peticion_propuesta_admin:
            dt_propuesta_utc = (
                peticion_propuesta_admin.fecha_propuesta.replace(tzinfo=timezone.utc)
                if peticion_propuesta_admin.fecha_propuesta.tzinfo is None
                else peticion_propuesta_admin.fecha_propuesta
            )
            diferencia_segundos = abs((fecha_propuesta - dt_propuesta_utc).total_seconds())
            # Si el cliente acepta el mismo horario que propuso Maxi (tolerancia 15 min),
            # confirmamos automáticamente la Cita en el calendario.
            if diferencia_segundos <= 900:
                from app.Modules.citas.schema import CitaCreate
                from app.Modules.citas.service import CitaService
                from app.Modules.peticiones.router import _resolver_vehiculo_id_peticion
                from fastapi import HTTPException

                vehiculo_final = vehiculo_limpio or peticion_propuesta_admin.vehiculo_modelo
                vehiculo_id_resuelto = _resolver_vehiculo_id_peticion(
                    session=session,
                    telefono=telefono,
                    vehiculo_modelo=vehiculo_final,
                )
                cita_service = CitaService(session)
                try:
                    cita_service.create_cita(
                        CitaCreate(
                            cliente_telefono=telefono,
                            vehiculo_id=vehiculo_id_resuelto,
                            fecha=dt_propuesta_utc,
                            estado="confirmada",
                        )
                    )
                    peticion_propuesta_admin.fecha_propuesta = dt_propuesta_utc
                    peticion_propuesta_admin.estado = "completada"
                    session.add(peticion_propuesta_admin)
                    session.flush()
                    return peticion_propuesta_admin
                except HTTPException as e:
                    # Si hubo conflicto de horario (ej: solapamiento con otra cita agendada en ese ínterin),
                    # no dejamos caer la transacción general: mantenemos la petición en 'pendiente_admin'
                    # para que Maxi la revise y resuelva manualmente en el calendario.
                    logger.warning(
                        "Conflicto al confirmar automáticamente cita para %s (%s). Se deja como pendiente_admin: %s",
                        telefono,
                        dt_propuesta_utc.isoformat(),
                        e.detail,
                    )
                    peticion_propuesta_admin.fecha_propuesta = dt_propuesta_utc
                    peticion_propuesta_admin.estado = "pendiente_admin"
                    peticion_propuesta_admin.origen = "cliente"
                    session.add(peticion_propuesta_admin)
                    session.flush()
                    return peticion_propuesta_admin

            # Si el cliente contrapropone un horario distinto al que le ofreció Maxi,
            # pasa de vuelta a 'pendiente_admin' ('Recibidas IA') con la nueva fecha.
            peticion_propuesta_admin.cliente_nombre = nombre_cliente
            if vehiculo_limpio:
                peticion_propuesta_admin.vehiculo_modelo = vehiculo_limpio
            peticion_propuesta_admin.fecha_propuesta = fecha_propuesta
            peticion_propuesta_admin.origen = "cliente"
            peticion_propuesta_admin.estado = "pendiente_admin"
            session.add(peticion_propuesta_admin)
            session.flush()
            return peticion_propuesta_admin

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
            accion = "cita_confirmada_por_cliente" if peticion.estado == "completada" else "peticion_creada"
            logger.info(
                "Petición de cita procesada en DB (ID: %s | Estado: %s | Auto: %s | Fecha: %s)",
                peticion_id,
                peticion.estado,
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
