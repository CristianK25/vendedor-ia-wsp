from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from datetime import datetime

from app.Core.database import get_session
from app.Core.Security.deps import require_bot_or_admin
from app.Modules.n8n.schema import N8NCitaCreate, N8NCitaCancel
from app.Modules.vehiculos.service import VehiculoService
from app.Modules.citas.service import CitaService
from app.Modules.citas.schema import CitaCreate, CitaUpdate

router = APIRouter(prefix="/n8n", tags=["N8N"], dependencies=[Depends(require_bot_or_admin)])

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

@router.post("/citas/agendar")
def agendar_cita(cita_data: N8NCitaCreate, session: Session = Depends(get_session)):
    service = CitaService(session)
    cita_create = CitaCreate(
        vehiculo_id=cita_data.vehiculo_id,
        cliente_telefono=cita_data.cliente_telefono,
        fecha=cita_data.fecha,
        estado="pendiente",
        notas=cita_data.notas or "Agendado por Vendedor IA"
    )
    return service.create_cita(cita_create)

@router.put("/citas/cancelar")
def cancelar_cita(cita_data: N8NCitaCancel, session: Session = Depends(get_session)):
    service = CitaService(session)
    cita_update = CitaUpdate(estado="cancelada")
    return service.update_cita(cita_data.cita_id, cita_update)
