from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List, Optional
import math
from app.Core.database import get_session
from app.Modules.clientes.service import ClienteService
from app.Modules.clientes.schema import ClienteCreate, ClienteUpdate, ClienteResponse, PaginatedClientesResponse

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.get("/", response_model=PaginatedClientesResponse)
def get_clientes(
    page: int = 1, 
    size: int = 50, 
    search: str = "",
    sort_by: str = "",
    sort_dir: str = "asc",
    etiqueta_id: Optional[int] = None,
    session: Session = Depends(get_session)
):
    service = ClienteService(session)
    skip = (page - 1) * size
    items, total = service.get_all_clientes(skip=skip, limit=size, search=search, sort_by=sort_by, sort_dir=sort_dir, etiqueta_id=etiqueta_id)
    
    total_pages = math.ceil(total / size) if total > 0 else 1
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": total_pages
    }

@router.post("/", response_model=ClienteResponse)
def create_cliente(cliente: ClienteCreate, session: Session = Depends(get_session)):
    service = ClienteService(session)
    return service.create_cliente(cliente)

@router.get("/{telefono}", response_model=ClienteResponse)
def get_cliente(telefono: str, session: Session = Depends(get_session)):
    service = ClienteService(session)
    return service.get_cliente(telefono)

@router.put("/{telefono}", response_model=ClienteResponse)
def update_cliente(telefono: str, cliente: ClienteUpdate, session: Session = Depends(get_session)):
    service = ClienteService(session)
    return service.update_cliente(telefono, cliente)
