from fastapi import APIRouter, Depends
from sqlmodel import Session
import math
from app.Core.database import get_session
from app.Modules.trabajadores.service import TrabajadorService
from app.Modules.trabajadores.schema import TrabajadorResponse, PaginatedTrabajadoresResponse
from app.Modules.usuarios.schema import UsuarioCreate, UsuarioUpdate

router = APIRouter(prefix="/trabajadores", tags=["Trabajadores"])

def _map_to_response(u):
    return TrabajadorResponse(
        id=u.id,
        nombre=u.nombre,
        telefono=u.telefono,
        rol=u.rol_trabajador
    )

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
        "items": [_map_to_response(i) for i in items],
        "total": total,
        "page": page,
        "size": size,
        "total_pages": total_pages
    }

@router.post("/", response_model=TrabajadorResponse)
def create_trabajador(trabajador: UsuarioCreate, session: Session = Depends(get_session)):
    service = TrabajadorService(session)
    u = service.create_trabajador(trabajador)
    return _map_to_response(u)

@router.get("/{trabajador_id}", response_model=TrabajadorResponse)
def get_trabajador(trabajador_id: int, session: Session = Depends(get_session)):
    service = TrabajadorService(session)
    u = service.get_trabajador(trabajador_id)
    return _map_to_response(u)

@router.put("/{trabajador_id}", response_model=TrabajadorResponse)
def update_trabajador(trabajador_id: int, trabajador: UsuarioUpdate, session: Session = Depends(get_session)):
    service = TrabajadorService(session)
    u = service.update_trabajador(trabajador_id, trabajador)
    return _map_to_response(u)

@router.delete("/{trabajador_id}")
def delete_trabajador(trabajador_id: int, session: Session = Depends(get_session)):
    service = TrabajadorService(session)
    return service.delete_trabajador(trabajador_id)
