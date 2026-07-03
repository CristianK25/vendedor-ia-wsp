from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List
from app.Core.database import get_session
from app.Modules.ventas.service import VentaService
from app.Modules.ventas.schema import VentaCreate, VentaResponse

router = APIRouter(prefix="/ventas", tags=["Ventas"])

@router.get("/", response_model=List[VentaResponse])
def get_ventas(session: Session = Depends(get_session)):
    service = VentaService(session)
    return service.get_all_ventas()

@router.post("/", response_model=VentaResponse)
def create_venta(venta: VentaCreate, session: Session = Depends(get_session)):
    service = VentaService(session)
    return service.create_venta(venta)

@router.get("/{venta_id}", response_model=VentaResponse)
def get_venta(venta_id: int, session: Session = Depends(get_session)):
    service = VentaService(session)
    return service.get_venta(venta_id)
