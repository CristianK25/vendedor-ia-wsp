from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime

from app.Core.database import get_session
from app.Core.Security.deps import verify_n8n_internal_request
from app.Modules.n8n.schema import N8NCitaCreate, N8NCitaCancel, N8NClienteCheck, N8NResenaCreate, PeticionCreateN8N
from app.Modules.vehiculos.service import VehiculoService
from app.Modules.citas.service import CitaService
from app.Modules.citas.schema import CitaCreate, CitaUpdate
from app.Modules.clientes.service import ClienteService
from app.Modules.clientes.schema import ClienteCreate, ClienteUpdate
from app.Modules.peticiones.model import Peticion

router = APIRouter(prefix="/n8n", tags=["N8N"], dependencies=[Depends(verify_n8n_internal_request)])

@router.get("/vehiculos/buscar")
def buscar_vehiculos(
    search: str = "",
    precio_max: float = None,
    session: Session = Depends(get_session)
):
    service = VehiculoService(session)
    return service.get_all_vehiculos(search=search, precio_max=precio_max, estado="disponible")

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
        # El cliente existe, actualizamos la última interacción si se envió
        if cliente_data.ultima_interaccion_cliente:
            update_data = ClienteUpdate(ultima_interaccion_cliente=cliente_data.ultima_interaccion_cliente)
            cliente = service.update_cliente(cliente.telefono, update_data)
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
