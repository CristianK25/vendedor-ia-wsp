from fastapi import APIRouter, Depends, Form, File, UploadFile
from sqlmodel import Session
from typing import List
from app.Core.database import get_session
from app.Modules.vehiculos.service import VehiculoService
from app.Modules.vehiculos.schema import VehiculoCreate, VehiculoUpdate, VehiculoResponse, PaginatedVehiculosResponse
import math

router = APIRouter(prefix="/vehiculos", tags=["Vehiculos"])

@router.get("/", response_model=PaginatedVehiculosResponse)
def get_vehiculos(
    page: int = 1, 
    size: int = 50, 
    search: str = "",
    estado: str = "",
    sort_by: str = "",
    sort_dir: str = "asc",
    session: Session = Depends(get_session)
):
    service = VehiculoService(session)
    skip = (page - 1) * size
    items, total = service.get_all_vehiculos(skip=skip, limit=size, search=search, estado=estado, sort_by=sort_by, sort_dir=sort_dir)
    
    total_pages = math.ceil(total / size) if total > 0 else 1
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": total_pages
    }

@router.get("/catalogo", response_model=List[VehiculoResponse])
def get_catalogo_n8n(session: Session = Depends(get_session)):
    """Endpoint optimizado para que n8n consulte vehículos disponibles"""
    service = VehiculoService(session)
    return service.get_disponibles()

@router.post("/", response_model=VehiculoResponse)
async def create_vehiculo(
    vehiculo: str = Form(...),
    imagenes: List[UploadFile] = File([]),
    session: Session = Depends(get_session)
):
    service = VehiculoService(session)
    vehiculo_data = VehiculoCreate.model_validate_json(vehiculo)
    return await service.create_vehiculo_con_imagenes(vehiculo_data, imagenes)

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
