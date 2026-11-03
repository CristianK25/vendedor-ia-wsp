from datetime import datetime, timezone
from urllib.parse import quote
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from app.Core.database import get_session
from app.Core.Security.deps import require_admin
from app.Modules.clientes.model import Cliente
from app.Modules.peticiones.model import Peticion
from app.Modules.peticiones.schema import PeticionRead, PeticionPosponer
from app.Modules.peticiones.service import PeticionService

MENDOZA_TZ = ZoneInfo("America/Argentina/Mendoza")

# Este router es exclusivamente para el panel de administración
router = APIRouter(prefix="/peticiones", tags=["Peticiones Admin"], dependencies=[Depends(require_admin)])


def _ensure_utc(dt: datetime) -> datetime:
    """Garantiza que un datetime leído de PostgreSQL (naive UTC) tenga tzinfo=timezone.utc."""
    if dt is None:
        return dt
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)


def _normalizar_fecha_admin(dt: datetime) -> datetime:
    """
    Convierte la fecha/hora seleccionada por el admin en <input type="datetime-local" />
    (hora local nominal de Mendoza) a UTC con timezone para SQLModel y serialización ISO.
    """
    if dt.tzinfo is None:
        return dt.replace(tzinfo=MENDOZA_TZ).astimezone(timezone.utc)
    return dt.astimezone(timezone.utc)


def _resolver_vehiculo_id_peticion(session: Session, telefono: str, vehiculo_modelo: str | None) -> int | None:
    """Intenta asociar la Cita al vehiculo_id real (por última interacción de compra o coincidencia de modelo)."""
    from app.Modules.interacciones.model import Interaccion, TipoIntencion
    from app.Modules.vehiculos.model import Vehiculo

    inter = session.exec(
        select(Interaccion)
        .where(
            Interaccion.cliente_telefono == telefono,
            Interaccion.tipo == TipoIntencion.compra,
            Interaccion.vehiculo_id.is_not(None),
        )
        .order_by(Interaccion.id.desc())
    ).first()
    if inter and inter.vehiculo_id:
        return inter.vehiculo_id

    if vehiculo_modelo:
        modelo_lower = vehiculo_modelo.lower()
        vehiculos = session.exec(select(Vehiculo).where(Vehiculo.activo.is_(True))).all()
        for v in vehiculos:
            if v.modelo and v.modelo.lower() in modelo_lower:
                return v.id
    return None


@router.get("/", response_model=List[PeticionRead])
def listar_peticiones(session: Session = Depends(get_session)):
    # Solo devolvemos las peticiones que están "vivas" y cuyo cliente no fue eliminado
    stmt = (
        select(Peticion)
        .join(Cliente, Peticion.cliente_telefono == Cliente.telefono, isouter=True)
        .where(
            Peticion.estado.in_(["pendiente_admin", "pendiente_cliente"]),
            (Cliente.activo == True) | (Cliente.telefono == None),
        )
        .order_by(Peticion.fecha_propuesta.asc())
    )
    peticiones = session.exec(stmt).all()
    for p in peticiones:
        if p.fecha_propuesta and p.fecha_propuesta.tzinfo is None:
            p.fecha_propuesta = p.fecha_propuesta.replace(tzinfo=timezone.utc)
    return peticiones


@router.post("/{peticion_id}/aceptar")
def aceptar_peticion(peticion_id: int, session: Session = Depends(get_session)):
    peticion = session.get(Peticion, peticion_id)
    if not peticion:
        raise HTTPException(status_code=404, detail="Petición no encontrada")
    
    if peticion.estado != "pendiente_admin":
        raise HTTPException(status_code=400, detail="Solo se pueden aceptar peticiones nuevas creadas por el cliente (pendiente_admin)")
        
    # Al aceptar la propuesta del cliente, confirmamos y creamos la Cita de inmediato
    from app.Modules.citas.service import CitaService
    from app.Modules.citas.schema import CitaCreate
    
    fecha_utc = _ensure_utc(peticion.fecha_propuesta)
    vehiculo_id_resuelto = _resolver_vehiculo_id_peticion(
        session=session,
        telefono=peticion.cliente_telefono,
        vehiculo_modelo=peticion.vehiculo_modelo,
    )
    service = CitaService(session)
    cita_create = CitaCreate(
        cliente_telefono=peticion.cliente_telefono,
        vehiculo_id=vehiculo_id_resuelto,
        fecha=fecha_utc,
        estado="confirmada",
    )
    nueva_cita = service.create_cita(cita_create)

    peticion.fecha_propuesta = fecha_utc
    peticion.estado = "completada"
    session.add(peticion)

    # Registrar en el historial de conversación que la cita fue confirmada
    from app.Modules.agent.model import AgentChatMessage
    fecha_mza = fecha_utc.astimezone(MENDOZA_TZ).strftime("%d/%m/%Y a las %H:%M")
    vehiculo_txt = peticion.vehiculo_modelo or "el vehículo consultado"
    mensaje_wsp = (
        f"¡Hola {peticion.cliente_nombre}! 👋 Soy Maxi. Te confirmo nuestra cita para ver "
        f"{vehiculo_txt} el día {fecha_mza} hs. Te paso la ubicación por acá. ¡Te espero!"
    )
    session.add(
        AgentChatMessage(
            session_id=peticion.cliente_telefono,
            role="assistant",
            content=mensaje_wsp,
            camino="agendar_cita",
        )
    )
    session.commit()

    enviado_ok = PeticionService.notificar_n8n(
        peticion_id=peticion.id,
        cliente_telefono=peticion.cliente_telefono,
        cliente_nombre=peticion.cliente_nombre,
        vehiculo_modelo=vehiculo_txt,
        fecha_propuesta=fecha_utc.isoformat(),
        accion="aceptada",
        fecha_formateada=fecha_mza,
        mensaje_whatsapp=mensaje_wsp,
    )

    telefono_limpio = "".join(c for c in peticion.cliente_telefono if c.isdigit())
    whatsapp_url = f"https://wa.me/{telefono_limpio}?text={quote(mensaje_wsp)}"

    return {
        "status": "success",
        "message": "Petición aceptada y enviada por WhatsApp" if enviado_ok else "Petición aceptada (no se pudo enviar por n8n)",
        "cita": nueva_cita,
        "mensaje_whatsapp": mensaje_wsp,
        "whatsapp_url": whatsapp_url,
        "enviado_por_bot": enviado_ok,
    }


@router.post("/{peticion_id}/posponer")
def posponer_peticion(peticion_id: int, datos: PeticionPosponer, session: Session = Depends(get_session)):
    peticion_original = session.get(Peticion, peticion_id)
    if not peticion_original:
        raise HTTPException(status_code=404, detail="Petición no encontrada")
        
    # Cancelar la original (asegurando timezone en fecha_propuesta para validación de SQLModel)
    peticion_original.fecha_propuesta = _ensure_utc(peticion_original.fecha_propuesta)
    peticion_original.estado = "cancelada"
    session.add(peticion_original)
    
    nueva_fecha_utc = _normalizar_fecha_admin(datos.fecha_propuesta)

    # Crear nueva propuesta
    nueva_peticion = Peticion(
        cliente_nombre=peticion_original.cliente_nombre,
        cliente_telefono=peticion_original.cliente_telefono,
        vehiculo_modelo=peticion_original.vehiculo_modelo,
        fecha_propuesta=nueva_fecha_utc,
        origen="admin",
        estado="pendiente_cliente",
        peticion_padre_id=peticion_original.id
    )
    session.add(nueva_peticion)

    # Registrar en el historial de conversación la contrapropuesta de horario de Maxi
    from app.Modules.agent.model import AgentChatMessage
    fecha_mza = nueva_fecha_utc.astimezone(MENDOZA_TZ).strftime("%d/%m/%Y a las %H:%M")
    vehiculo_txt = nueva_peticion.vehiculo_modelo or "el vehículo"
    mensaje_wsp = (
        f"¡Hola {nueva_peticion.cliente_nombre}! 👋 Soy Maxi. Por tu consulta para ver {vehiculo_txt}, "
        f"en el horario que me pediste se me complica, pero te puedo recibir el día {fecha_mza} hs. "
        f"¿Te queda cómodo ese horario?"
    )
    session.add(
        AgentChatMessage(
            session_id=nueva_peticion.cliente_telefono,
            role="assistant",
            content=mensaje_wsp,
            camino="agendar_cita",
        )
    )
    session.commit()
    session.refresh(nueva_peticion)

    enviado_ok = PeticionService.notificar_n8n(
        peticion_id=nueva_peticion.id,
        cliente_telefono=nueva_peticion.cliente_telefono,
        cliente_nombre=nueva_peticion.cliente_nombre,
        vehiculo_modelo=vehiculo_txt,
        fecha_propuesta=nueva_fecha_utc.isoformat(),
        accion="pospuesta",
        token_confirmacion=nueva_peticion.token_confirmacion,
        fecha_formateada=fecha_mza,
        mensaje_whatsapp=mensaje_wsp,
    )

    telefono_limpio = "".join(c for c in nueva_peticion.cliente_telefono if c.isdigit())
    whatsapp_url = f"https://wa.me/{telefono_limpio}?text={quote(mensaje_wsp)}"

    return {
        "status": "success",
        "message": "Petición pospuesta y enviada por WhatsApp" if enviado_ok else "Petición pospuesta (no se pudo enviar por n8n)",
        "nueva_peticion_id": nueva_peticion.id,
        "mensaje_whatsapp": mensaje_wsp,
        "whatsapp_url": whatsapp_url,
        "enviado_por_bot": enviado_ok,
    }


@router.post("/{peticion_id}/reenviar_whatsapp")
def reenviar_whatsapp_peticion(peticion_id: int, session: Session = Depends(get_session)):
    peticion = session.get(Peticion, peticion_id)
    if not peticion:
        raise HTTPException(status_code=404, detail="Petición no encontrada")

    fecha_utc = _ensure_utc(peticion.fecha_propuesta)
    fecha_mza = fecha_utc.astimezone(MENDOZA_TZ).strftime("%d/%m/%Y a las %H:%M")
    vehiculo_txt = peticion.vehiculo_modelo or "el vehículo"

    if peticion.estado == "pendiente_cliente":
        accion = "pospuesta"
        mensaje_wsp = (
            f"¡Hola {peticion.cliente_nombre}! 👋 Soy Maxi. Por tu consulta para ver {vehiculo_txt}, "
            f"en el horario que me pediste se me complica, pero te puedo recibir el día {fecha_mza} hs. "
            f"¿Te queda cómodo ese horario?"
        )
    else:
        accion = "aceptada"
        mensaje_wsp = (
            f"¡Hola {peticion.cliente_nombre}! 👋 Soy Maxi. Te confirmo nuestra cita para ver "
            f"{vehiculo_txt} el día {fecha_mza} hs. Te paso la ubicación por acá. ¡Te espero!"
        )

    enviado_ok = PeticionService.notificar_n8n(
        peticion_id=peticion.id,
        cliente_telefono=peticion.cliente_telefono,
        cliente_nombre=peticion.cliente_nombre,
        vehiculo_modelo=vehiculo_txt,
        fecha_propuesta=fecha_utc.isoformat(),
        accion=accion,
        token_confirmacion=peticion.token_confirmacion,
        fecha_formateada=fecha_mza,
        mensaje_whatsapp=mensaje_wsp,
    )
    if not enviado_ok:
        raise HTTPException(
            status_code=502,
            detail="No se pudo enviar el mensaje a través del flujo 'Enviar WSP' en n8n. Verificá que el workflow esté activo.",
        )

    return {
        "status": "success",
        "message": "Mensaje enviado por el Bot de WhatsApp",
        "mensaje_whatsapp": mensaje_wsp,
        "enviado_por_bot": True,
    }


@router.post("/{peticion_id}/cancelar")
def cancelar_peticion(peticion_id: int, session: Session = Depends(get_session)):
    peticion = session.get(Peticion, peticion_id)
    if not peticion:
        raise HTTPException(status_code=404, detail="Petición no encontrada")
        
    peticion.fecha_propuesta = _ensure_utc(peticion.fecha_propuesta)
    peticion.estado = "cancelada"
    session.add(peticion)
    session.commit()
    
    return {"status": "success", "message": "Petición cancelada internamente (sin notificar al cliente)"}


@router.post("/{peticion_id}/forzar_confirmacion")
def forzar_confirmacion(peticion_id: int, session: Session = Depends(get_session)):
    peticion = session.get(Peticion, peticion_id)
    if not peticion:
        raise HTTPException(status_code=404, detail="Petición no encontrada")
    
    if peticion.estado == "completada" or peticion.estado == "cancelada":
        raise HTTPException(status_code=400, detail=f"La petición ya está {peticion.estado}")

    # Importación local para evitar ciclos
    from app.Modules.citas.service import CitaService
    from app.Modules.citas.schema import CitaCreate
    
    fecha_utc = _ensure_utc(peticion.fecha_propuesta)
    vehiculo_id_resuelto = _resolver_vehiculo_id_peticion(
        session=session,
        telefono=peticion.cliente_telefono,
        vehiculo_modelo=peticion.vehiculo_modelo,
    )
    # Transformar a cita
    service = CitaService(session)
    cita_create = CitaCreate(
        cliente_telefono=peticion.cliente_telefono,
        vehiculo_id=vehiculo_id_resuelto,
        fecha=fecha_utc,
        estado="confirmada",
    )
    nueva_cita = service.create_cita(cita_create)
    
    # Marcar petición como completada
    peticion.fecha_propuesta = fecha_utc
    peticion.estado = "completada"
    session.add(peticion)

    from app.Modules.agent.model import AgentChatMessage
    fecha_mza = fecha_utc.astimezone(MENDOZA_TZ).strftime("%d/%m/%Y a las %H:%M")
    vehiculo_txt = peticion.vehiculo_modelo or "el vehículo consultado"
    session.add(
        AgentChatMessage(
            session_id=peticion.cliente_telefono,
            role="assistant",
            content=f"✅ Turno reprogramado y confirmado para ver {vehiculo_txt} el día {fecha_mza} hs.",
            camino="agendar_cita",
        )
    )
    session.commit()
    
    return {"status": "success", "message": "Cita confirmada manualmente por el administrador", "cita": nueva_cita}
