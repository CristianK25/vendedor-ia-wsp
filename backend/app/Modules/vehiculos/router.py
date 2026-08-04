from fastapi import APIRouter, Depends, Form, File, UploadFile
from sqlmodel import Session
from typing import List, Optional
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
    precio_min: Optional[float] = None,
    precio_max: Optional[float] = None,
    km_min: Optional[int] = None,
    km_max: Optional[int] = None,
    anio_min: Optional[int] = None,
    anio_max: Optional[int] = None,
    transmision: str = "",
    traccion: str = "",
    tipo: str = "",
    condicion: str = "",
    sort_by: str = "",
    sort_dir: str = "asc",
    session: Session = Depends(get_session)
):
    service = VehiculoService(session)
    skip = (page - 1) * size
    items, total = service.get_all_vehiculos(
        skip=skip, limit=size, search=search, estado=estado, 
        precio_min=precio_min, precio_max=precio_max, km_min=km_min, km_max=km_max,
        anio_min=anio_min, anio_max=anio_max, transmision=transmision,
        traccion=traccion, tipo=tipo, condicion=condicion,
        sort_by=sort_by, sort_dir=sort_dir
    )
    
    total_pages = math.ceil(total / size) if total > 0 else 1
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": total_pages
    }

@router.get("/stats")
def get_vehiculos_stats(session: Session = Depends(get_session)):
    service = VehiculoService(session)
    return service.get_stats()

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

@router.delete("/{vehiculo_id}/venta_y_vehiculo")
def anular_venta_y_eliminar_vehiculo(vehiculo_id: int, session: Session = Depends(get_session)):
    service = VehiculoService(session)
    return service.anular_venta_y_eliminar_vehiculo(vehiculo_id)

from app.Modules.documentos.service import DocumentosService
from app.Modules.documentos.schema import DocumentoVehiculoResponse
from app.Modules.documentos.model import TipoDocumento
from app.Modules.vehiculos.model import EtapaVehiculo

@router.get("/{vehiculo_id}/documentos", response_model=List[DocumentoVehiculoResponse])
def get_documentos(vehiculo_id: int, session: Session = Depends(get_session)):
    service = DocumentosService(session)
    return service.get_documentos_by_vehiculo(vehiculo_id)

@router.post("/{vehiculo_id}/documentos", response_model=DocumentoVehiculoResponse)
async def subir_documento(
    vehiculo_id: int,
    etapa: EtapaVehiculo = Form(...),
    tipo_documento: TipoDocumento = Form(...),
    archivo: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    service = DocumentosService(session)
    return await service.subir_documento(vehiculo_id, etapa, tipo_documento, archivo)

@router.put("/{vehiculo_id}/avanzar-etapa", response_model=VehiculoResponse)
def avanzar_etapa(vehiculo_id: int, session: Session = Depends(get_session)):
    # Avanza el vehículo a la siguiente etapa si cumple requisitos
    doc_service = DocumentosService(session)
    vehiculo_service = VehiculoService(session)
    
    vehiculo = vehiculo_service.get_vehiculo(vehiculo_id)
    
    # Validar etapa actual
    doc_service.validar_requisitos_etapa(vehiculo_id, vehiculo.etapa)
    
    # Transición de etapas
    siguiente_etapa = None
    if vehiculo.etapa == EtapaVehiculo.pre_compra:
        siguiente_etapa = EtapaVehiculo.comprado
    elif vehiculo.etapa == EtapaVehiculo.comprado:
        siguiente_etapa = EtapaVehiculo.en_stock
    elif vehiculo.etapa == EtapaVehiculo.en_stock:
        siguiente_etapa = EtapaVehiculo.vendido
    
    if not siguiente_etapa:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="El vehículo ya se encuentra en la última etapa.")
        
    vehiculo.etapa = siguiente_etapa
    vehiculo_service.repository.update(vehiculo)
    return vehiculo
