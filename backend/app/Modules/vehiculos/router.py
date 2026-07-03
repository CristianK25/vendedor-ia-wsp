from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List
from app.Core.database import get_session
from app.Modules.vehiculos.service import VehiculoService
from app.Modules.vehiculos.schema import VehiculoCreate, VehiculoUpdate, VehiculoResponse

router = APIRouter(prefix="/vehiculos", tags=["Vehiculos"])

@router.get("/", response_model=List[VehiculoResponse])
def get_vehiculos(session: Session = Depends(get_session)):
    service = VehiculoService(session)
    return service.get_all_vehiculos()

@router.get("/catalogo", response_model=List[VehiculoResponse])
def get_catalogo_n8n(session: Session = Depends(get_session)):
    """Endpoint optimizado para que n8n consulte vehículos disponibles"""
    service = VehiculoService(session)
    return service.get_disponibles()

@router.post("/", response_model=VehiculoResponse)
def create_vehiculo(vehiculo: VehiculoCreate, session: Session = Depends(get_session)):
    service = VehiculoService(session)
    return service.create_vehiculo(vehiculo)

@router.get("/{vehiculo_id}", response_model=VehiculoResponse)
def get_vehiculo(vehiculo_id: int, session: Session = Depends(get_session)):
    service = VehiculoService(session)
    return service.get_vehiculo(vehiculo_id)

@router.put("/{vehiculo_id}", response_model=VehiculoResponse)
def update_vehiculo(vehiculo_id: int, vehiculo: VehiculoUpdate, session: Session = Depends(get_session)):
    service = VehiculoService(session)
    return service.update_vehiculo(vehiculo_id, vehiculo)

@router.delete("/{vehiculo_id}")
def delete_vehiculo(vehiculo_id: int, session: Session = Depends(get_session)):
    service = VehiculoService(session)
    return service.delete_vehiculo(vehiculo_id)
