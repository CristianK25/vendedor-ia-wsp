from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List
import math
from app.Core.database import get_session
from app.Modules.trabajadores.service import TrabajadorService
from app.Modules.trabajadores.schema import TrabajadorCreate, TrabajadorUpdate, TrabajadorResponse, PaginatedTrabajadoresResponse

router = APIRouter(prefix="/trabajadores", tags=["Trabajadores"])

@router.get("/", response_model=PaginatedTrabajadoresResponse)
def get_trabajadores(
    page: int = 1, 
    size: int = 50, 
    search: str = "",
    session: Session = Depends(get_session)
):
    service = TrabajadorService(session)
    skip = (page - 1) * size
    items, total = service.get_all_trabajadores(skip=skip, limit=size, search=search)
    
    total_pages = math.ceil(total / size) if total > 0 else 1
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": total_pages
    }

@router.post("/", response_model=TrabajadorResponse)
def create_trabajador(trabajador: TrabajadorCreate, session: Session = Depends(get_session)):
    service = TrabajadorService(session)
    return service.create_trabajador(trabajador)

@router.get("/{trabajador_id}", response_model=TrabajadorResponse)
def get_trabajador(trabajador_id: int, session: Session = Depends(get_session)):
    service = TrabajadorService(session)
    return service.get_trabajador(trabajador_id)

@router.put("/{trabajador_id}", response_model=TrabajadorResponse)
def update_trabajador(trabajador_id: int, trabajador: TrabajadorUpdate, session: Session = Depends(get_session)):
    service = TrabajadorService(session)
    return service.update_trabajador(trabajador_id, trabajador)

@router.delete("/{trabajador_id}")
def delete_trabajador(trabajador_id: int, session: Session = Depends(get_session)):
    service = TrabajadorService(session)
    return service.delete_trabajador(trabajador_id)
