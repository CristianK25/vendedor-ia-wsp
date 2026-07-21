from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from typing import List

from app.Core.database import get_session
from app.Core.Security.deps import require_admin
from app.Modules.peticiones.model import Peticion
from app.Modules.peticiones.schema import PeticionRead, PeticionPosponer
from app.Modules.peticiones.service import PeticionService

# Este router es exclusivamente para el panel de administración
router = APIRouter(prefix="/peticiones", tags=["Peticiones Admin"], dependencies=[Depends(require_admin)])

@router.get("/", response_model=List[PeticionRead])
def listar_peticiones(session: Session = Depends(get_session)):
    # Solo devolvemos las peticiones que están "vivas" en la negociación
    peticiones = session.exec(
        select(Peticion).where(Peticion.estado.in_(["pendiente_admin", "pendiente_cliente"]))
    ).all()
    return peticiones

@router.post("/{peticion_id}/aceptar")
def aceptar_peticion(peticion_id: int, background_tasks: BackgroundTasks, session: Session = Depends(get_session)):
    peticion = session.get(Peticion, peticion_id)
    if not peticion:
        raise HTTPException(status_code=404, detail="Petición no encontrada")
    
    if peticion.estado != "pendiente_admin":
        raise HTTPException(status_code=400, detail="Solo se pueden aceptar peticiones nuevas creadas por el cliente (pendiente_admin)")
        
    peticion.estado = "pendiente_cliente"
    session.add(peticion)
    session.commit()
    
    # Notificar a N8N en segundo plano
    background_tasks.add_task(
        PeticionService.notificar_n8n,
        peticion_id=peticion.id,
        cliente_telefono=peticion.cliente_telefono,
        cliente_nombre=peticion.cliente_nombre,
        vehiculo_modelo=peticion.vehiculo_modelo or "N/A",
        fecha_propuesta=peticion.fecha_propuesta.isoformat(),
        accion="aceptada"
    )
    
    return {"status": "success", "message": "Petición aceptada y cliente notificado vía n8n"}

@router.post("/{peticion_id}/posponer")
def posponer_peticion(peticion_id: int, datos: PeticionPosponer, background_tasks: BackgroundTasks, session: Session = Depends(get_session)):
    peticion_original = session.get(Peticion, peticion_id)
    if not peticion_original:
        raise HTTPException(status_code=404, detail="Petición no encontrada")
        
    # Cancelar la original
    peticion_original.estado = "cancelada"
    session.add(peticion_original)
    
    # Crear nueva propuesta
    nueva_peticion = Peticion(
        cliente_nombre=peticion_original.cliente_nombre,
        cliente_telefono=peticion_original.cliente_telefono,
        vehiculo_modelo=peticion_original.vehiculo_modelo,
        fecha_propuesta=datos.fecha_propuesta,
        origen="admin",
        estado="pendiente_cliente",
        peticion_padre_id=peticion_original.id
    )
    session.add(nueva_peticion)
    session.commit()
    session.refresh(nueva_peticion)
    
    # Notificar a N8N en segundo plano
    background_tasks.add_task(
        PeticionService.notificar_n8n,
        peticion_id=nueva_peticion.id,
        cliente_telefono=nueva_peticion.cliente_telefono,
        cliente_nombre=nueva_peticion.cliente_nombre,
        vehiculo_modelo=nueva_peticion.vehiculo_modelo or "N/A",
        fecha_propuesta=nueva_peticion.fecha_propuesta.isoformat(),
        accion="pospuesta"
    )
    
    return {"status": "success", "message": "Petición pospuesta y cliente notificado", "nueva_peticion_id": nueva_peticion.id}

@router.post("/{peticion_id}/cancelar")
def cancelar_peticion(peticion_id: int, session: Session = Depends(get_session)):
    peticion = session.get(Peticion, peticion_id)
    if not peticion:
        raise HTTPException(status_code=404, detail="Petición no encontrada")
        
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
    
    return {"status": "success", "message": "Cita confirmada manualmente por el administrador", "cita": nueva_cita}
