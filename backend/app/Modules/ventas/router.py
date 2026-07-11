from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List
import math
from app.Core.database import get_session
from app.Modules.ventas.service import VentaService
from app.Modules.ventas.schema import VentaCreate, VentaResponse, PaginatedVentasResponse

router = APIRouter(prefix="/ventas", tags=["Ventas"])

@router.get("/", response_model=PaginatedVentasResponse)
def get_ventas(
    page: int = 1, 
    size: int = 50, 
    search: str = "",
    sort_by: str = "",
    sort_dir: str = "asc",
    session: Session = Depends(get_session)
):
    service = VentaService(session)
    skip = (page - 1) * size
    items, total = service.get_all_ventas(skip=skip, limit=size, search=search, sort_by=sort_by, sort_dir=sort_dir)
    
    total_pages = math.ceil(total / size) if total > 0 else 1
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": total_pages
    }

@router.post("/", response_model=VentaResponse)
def create_venta(venta: VentaCreate, session: Session = Depends(get_session)):
    service = VentaService(session)
    return service.create_venta(venta)

@router.get("/{venta_id}", response_model=VentaResponse)
def get_venta(venta_id: int, session: Session = Depends(get_session)):
    service = VentaService(session)
    return service.get_venta(venta_id)
