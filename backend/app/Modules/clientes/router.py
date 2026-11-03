from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import Optional
import math
from app.Core.database import get_session
from app.Modules.clientes.service import ClienteService
from app.Modules.clientes.schema import (
    ClienteCreate,
    ClienteUpdate,
    ClienteResponse,
    PaginatedClientesResponse,
    ClienteHistorialChatResponse,
)

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.get("/", response_model=PaginatedClientesResponse)
def get_clientes(
    page: int = 1, 
    size: int = 50, 
    search: str = "",
    sort_by: str = "",
    sort_dir: str = "asc",
    etiqueta_id: Optional[int] = None,
    estado_conversacion: Optional[str] = None,
    session: Session = Depends(get_session)
):
    service = ClienteService(session)
    skip = (page - 1) * size
    items, total, requiere_humano_count = service.get_all_clientes(
        skip=skip,
        limit=size,
        search=search,
        sort_by=sort_by,
        sort_dir=sort_dir,
        etiqueta_id=etiqueta_id,
        estado_conversacion=estado_conversacion,
    )
    
    total_pages = math.ceil(total / size) if total > 0 else 1
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": total_pages,
        "requiere_humano_count": requiere_humano_count,
    }

@router.post("/", response_model=ClienteResponse)
def create_cliente(cliente: ClienteCreate, session: Session = Depends(get_session)):
    service = ClienteService(session)
    return service.create_cliente(cliente)

@router.get("/{telefono}/mensajes", response_model=ClienteHistorialChatResponse)
def get_cliente_mensajes(telefono: str, limit: int = 100, session: Session = Depends(get_session)):
    service = ClienteService(session)
    return service.obtener_historial_chat(telefono, limit=limit)

@router.post("/{telefono}/atendido", response_model=ClienteResponse)
def marcar_cliente_atendido(telefono: str, session: Session = Depends(get_session)):
    service = ClienteService(session)
    return service.marcar_como_atendido(telefono)

@router.get("/{telefono}", response_model=ClienteResponse)
def get_cliente(telefono: str, session: Session = Depends(get_session)):
    service = ClienteService(session)
    return service.get_cliente(telefono)

@router.put("/{telefono}", response_model=ClienteResponse)
def update_cliente(telefono: str, cliente: ClienteUpdate, session: Session = Depends(get_session)):
    service = ClienteService(session)
    return service.update_cliente(telefono, cliente)

@router.delete("/{telefono}")
def delete_cliente(telefono: str, session: Session = Depends(get_session)):
    service = ClienteService(session)
    return service.delete_cliente(telefono)
