from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime
import asyncio

from app.Core.database import get_session
from app.Core.redis import get_redis_client
from app.Core.Security.deps import verify_n8n_internal_request
from app.Modules.n8n.schema import (
    N8NCitaCreate, N8NCitaCancel, N8NClienteCheck, N8NResenaCreate, PeticionCreateN8N,
    N8NWhatsAppBufferRequest, N8NWhatsAppBufferResponse
)
from app.Modules.vehiculos.service import VehiculoService
from app.Modules.citas.service import CitaService
from app.Modules.citas.schema import CitaCreate, CitaUpdate
from app.Modules.clientes.service import ClienteService
from app.Modules.clientes.schema import ClienteCreate, ClienteUpdate
from app.Modules.peticiones.model import Peticion
from app.Modules.interacciones.schema import InteraccionCreate
from app.Modules.interacciones.service import InteraccionService

router = APIRouter(prefix="/n8n", tags=["N8N"], dependencies=[Depends(verify_n8n_internal_request)])

@router.get("/vehiculos/buscar")
def buscar_vehiculos(
    search: str = "",
    precio_max: str | float | None = None,
    session: Session = Depends(get_session)
):
    parsed_precio_max: float | None = None
    if precio_max is not None and str(precio_max).strip() != "" and str(precio_max).strip().lower() not in ["none", "null"]:
        try:
            parsed_precio_max = float(precio_max)
        except ValueError:
            parsed_precio_max = None

    service = VehiculoService(session)
    items, total = service.get_all_vehiculos(search=search, precio_max=parsed_precio_max, estado="disponible")
    return items

@router.get("/citas/buscar")
def buscar_citas(cliente_telefono: str = None, session: Session = Depends(get_session)):
    service = CitaService(session)
    citas = service.get_all_citas()
    
    if cliente_telefono:
        citas = [c for c in citas if c.cliente_telefono == cliente_telefono]
        
    return citas

@router.post("/peticiones")
def crear_peticion(peticion_data: PeticionCreateN8N, session: Session = Depends(get_session)):
    # Sanear vehiculo_modelo si viene como texto literal "null", "none", "N/A"
    vehiculo_limpio = peticion_data.vehiculo_modelo
    if vehiculo_limpio and vehiculo_limpio.strip().lower() in ["null", "none", "n/a", ""]:
        vehiculo_limpio = None

    # Buscar si ya existe una petición pendiente para este cliente
    statement = select(Peticion).where(
        Peticion.cliente_telefono == peticion_data.cliente_telefono,
        Peticion.estado == "pendiente_admin"
    )
    peticion_existente = session.exec(statement).first()

    if peticion_existente:
        # Actualizar la petición existente
        peticion_existente.cliente_nombre = peticion_data.cliente_nombre
        peticion_existente.vehiculo_modelo = vehiculo_limpio
        peticion_existente.fecha_propuesta = peticion_data.fecha_propuesta
        
        session.add(peticion_existente)
        session.commit()
        session.refresh(peticion_existente)
        return {"status": "success", "message": "Petición actualizada exitosamente", "peticion": peticion_existente}

    # Si no existe, crear una nueva
    nueva_peticion = Peticion(
        cliente_nombre=peticion_data.cliente_nombre,
        cliente_telefono=peticion_data.cliente_telefono,
        vehiculo_modelo=vehiculo_limpio,
        fecha_propuesta=peticion_data.fecha_propuesta,
        origen="cliente",
        estado="pendiente_admin"
    )
    session.add(nueva_peticion)
    session.commit()
    session.refresh(nueva_peticion)
    return {"status": "success", "message": "Petición creada exitosamente", "peticion": nueva_peticion}

@router.post("/peticiones/{peticion_id}/confirmar")
def confirmar_peticion(peticion_id: int, session: Session = Depends(get_session)):
    peticion = session.get(Peticion, peticion_id)
    if not peticion:
        raise HTTPException(status_code=404, detail="Petición no encontrada")
    
    if peticion.estado == "completada" or peticion.estado == "cancelada":
        raise HTTPException(status_code=400, detail=f"La petición ya está {peticion.estado}")

    # Transformar a cita
    service = CitaService(session)
    cita_create = CitaCreate(
        cliente_telefono=peticion.cliente_telefono,
        fecha=peticion.fecha_propuesta,
        estado="confirmada",
        notas=f"Auto: {peticion.vehiculo_modelo or 'N/A'}"
    )
    nueva_cita = service.create_cita(cita_create)
    
    # Marcar petición como completada
    peticion.estado = "completada"
    session.add(peticion)
    session.commit()
    
    return {"status": "success", "message": "Cita confirmada", "cita": nueva_cita}

@router.put("/citas/cancelar")
def cancelar_cita(cita_data: N8NCitaCancel, session: Session = Depends(get_session)):
    service = CitaService(session)
    cita_update = CitaUpdate(estado="cancelada")
    return service.update_cita(cita_data.cita_id, cita_update)

@router.post("/clientes/verificar_o_crear")
def verificar_o_crear_cliente(cliente_data: N8NClienteCheck, session: Session = Depends(get_session)):
    service = ClienteService(session)
    try:
        cliente = service.get_cliente(cliente_data.telefono)
        # El cliente existe, si estaba inactivo lo reactivamos
        update_dict = {}
        if not cliente.activo:
            update_dict["activo"] = True
        if cliente_data.ultima_interaccion_cliente:
            update_dict["ultima_interaccion_cliente"] = cliente_data.ultima_interaccion_cliente
            
        if update_dict:
            cliente = service.update_cliente(cliente.telefono, ClienteUpdate(**update_dict))
            
        return {"status": "success", "message": "Cliente existente actualizado", "cliente": cliente}
    except HTTPException as e:
        if e.status_code == 404:
            # No existe, lo creamos
            nuevo_cliente = ClienteCreate(
                telefono=cliente_data.telefono, 
                nombre=cliente_data.nombre
            )
            creado = service.create_cliente(nuevo_cliente)
            # Y luego le ponemos la fecha si la pasaron (el create no toma la fecha por default en schema)
            if cliente_data.ultima_interaccion_cliente:
                update_data = ClienteUpdate(ultima_interaccion_cliente=cliente_data.ultima_interaccion_cliente)
                creado = service.update_cliente(creado.telefono, update_data)
                
            return {"status": "success", "message": "Cliente creado exitosamente", "cliente": creado}
        raise e

@router.post("/resenas/guardar")
def guardar_resena(resena_data: N8NResenaCreate, session: Session = Depends(get_session)):
    from app.Modules.resenas.model import Resena
    
    nueva_resena = Resena(
        cliente_telefono=resena_data.cliente_telefono,
        comentario=resena_data.comentario
    )
    session.add(nueva_resena)
    session.commit()
    session.refresh(nueva_resena)
    
    return {"status": "success", "message": "Reseña guardada exitosamente", "resena": nueva_resena}

@router.get("/clientes/{telefono}/consultas/verificar")
def verificar_consulta_vehiculo(telefono: str, vehiculo_id: int, session: Session = Depends(get_session)):
    service = InteraccionService(session)
    interaccion = service.get_ultima_interaccion_cliente_vehiculo(telefono, vehiculo_id)
    
    if not interaccion:
        return {"status": "not_found", "message": "No hay consultas previas para este vehículo"}
        
    return {"status": "success", "message": "Interacción encontrada", "interaccion": interaccion}

@router.get("/clientes/{telefono}/estado-citas")
def verificar_estado_citas(telefono: str, session: Session = Depends(get_session)):
    from app.Modules.citas.model import Cita
    
    # Check for active citas (future)
    cita_activa = session.exec(
        select(Cita).where(
            Cita.cliente_telefono == telefono,
            Cita.estado == "confirmada",
            Cita.fecha >= datetime.utcnow()
        ).order_by(Cita.fecha.asc())
    ).first()
    
    # Check for pending peticiones
    peticion_pendiente = session.exec(
        select(Peticion).where(
            Peticion.cliente_telefono == telefono,
            Peticion.estado.in_(["pendiente_admin", "pendiente_cliente"])
        ).order_by(Peticion.fecha_propuesta.asc())
    ).first()
    
    return {
        "status": "success",
        "cita_activa": cita_activa,
        "peticion_pendiente": peticion_pendiente
    }

@router.post("/interacciones")
def crear_interaccion(data: InteraccionCreate, session: Session = Depends(get_session)):
    service = InteraccionService(session)
    nueva_interaccion = service.create(data)
    return {"status": "success", "message": "Interacción registrada exitosamente", "interaccion": nueva_interaccion}

@router.post("/whatsapp/buffer", response_model=N8NWhatsAppBufferResponse)
async def whatsapp_buffer(data: N8NWhatsAppBufferRequest):
    """
    Control de ráfagas (Debounce) atómico con Redis.
    Acumula mensajes que llegan en un intervalo corto (ej: 4s) para un mismo cliente.
    El mensaje líder espera y devuelve el texto unificado; los mensajes subsiguientes
    retornan 'procesar: False' para que n8n no lance ejecuciones duplicadas.
    """
    redis = get_redis_client()
    tel = data.cliente_telefono.strip()
    key_buffer = f"wsp:buffer:{tel}"
    key_lock = f"wsp:lock:{tel}"
    key_name = f"wsp:name:{tel}"

    try:
        # Guardar el nombre si vino informado
        if data.nombre and data.nombre.strip():
            await redis.set(key_name, data.nombre.strip(), ex=120)

        # Agregar mensaje a la lista en Redis
        await redis.rpush(key_buffer, data.texto.strip())
        await redis.expire(key_buffer, 120)

        # Intentar adquirir el cerrojo de "Líder" de la ráfaga
        is_leader = await redis.set(key_lock, "1", nx=True, ex=30)

        if not is_leader:
            # Mensaje acumulado en ráfaga (no es el líder)
            return N8NWhatsAppBufferResponse(
                procesar=False,
                cliente_telefono=tel,
                motivo="mensaje_acumulado_en_buffer"
            )

        # Mensaje Líder: espera el período de debounce (por defecto 4s)
        wait_time = max(1, min(data.wait_seconds or 4, 15))
        await asyncio.sleep(wait_time)

        # Extraer todos los mensajes acumulados
        mensajes = await redis.lrange(key_buffer, 0, -1)
        stored_name = await redis.get(key_name)

        # Limpiar claves de Redis para la próxima interacción
        await redis.delete(key_buffer)
        await redis.delete(key_lock)
        if stored_name:
            await redis.delete(key_name)

        mensaje_completo = "\n".join(mensajes) if mensajes else data.texto

        return N8NWhatsAppBufferResponse(
            procesar=True,
            cliente_telefono=tel,
            cliente_nombre=stored_name or data.nombre,
            mensaje_completo=mensaje_completo,
            total_mensajes=len(mensajes) if mensajes else 1
        )
    finally:
        await redis.aclose()

