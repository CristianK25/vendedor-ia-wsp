from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List
from app.Core.database import get_session
from app.Modules.vehiculos.service import VehiculoService
from app.Modules.vehiculos.schema import PublicVehiculoResponse

router = APIRouter(prefix="/public/catalogo", tags=["Catalogo Publico"])

@router.get("/", response_model=List[PublicVehiculoResponse])
def get_catalogo_publico(session: Session = Depends(get_session)):
    """Retorna los vehículos disponibles y activos para visualización pública en el catálogo."""
    service = VehiculoService(session)
    return service.get_disponibles()

@router.get("/{vehiculo_id}", response_model=PublicVehiculoResponse)
def get_vehiculo_publico(vehiculo_id: int, session: Session = Depends(get_session)):
    """Retorna el detalle público de un vehículo disponible."""
    service = VehiculoService(session)
    vehiculo = service.get_vehiculo(vehiculo_id)
    if not vehiculo or vehiculo.estado != "disponible" or not vehiculo.activo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Vehículo no encontrado o no disponible para la venta"
        )
    return vehiculo
