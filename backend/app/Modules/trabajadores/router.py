from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
import math
from app.Core.database import get_session
from app.Core.Security.deps import get_current_active_user
from app.Modules.usuarios.model import Usuario
from app.Modules.trabajadores.service import TrabajadorService
from app.Modules.trabajadores.schema import TrabajadorResponse, PaginatedTrabajadoresResponse
from app.Modules.usuarios.schema import UsuarioCreate, UsuarioUpdate

router = APIRouter(prefix="/trabajadores", tags=["Trabajadores"])

def _map_to_response(u):
    return TrabajadorResponse(
        id=u.id,
        nombre=u.nombre,
        apellido=u.apellido,
        email=u.email,
        rol_sistema=u.rol.value if hasattr(u.rol, 'value') else u.rol,
        rol=u.rol_trabajador,
        telefono=u.telefono,
        recibe_notificaciones=u.recibe_notificaciones
    )

@router.get("/", response_model=PaginatedTrabajadoresResponse)
def get_trabajadores(
    page: int = 1, 
    size: int = 50, 
    search: str = "",
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_active_user)
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
def create_trabajador(
    trabajador: UsuarioCreate, 
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_active_user)
):
    service = TrabajadorService(session)
    u = service.create_trabajador(trabajador)
    return _map_to_response(u)

@router.get("/{trabajador_id}", response_model=TrabajadorResponse)
def get_trabajador(
    trabajador_id: int, 
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_active_user)
):
    service = TrabajadorService(session)
    u = service.get_trabajador(trabajador_id)
    return _map_to_response(u)

@router.put("/{trabajador_id}", response_model=TrabajadorResponse)
def update_trabajador(
    trabajador_id: int, 
    trabajador: UsuarioUpdate, 
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_active_user)
):
    if current_user.id == trabajador_id and trabajador.rol:
        current_rol = (current_user.rol.value if hasattr(current_user.rol, 'value') else current_user.rol).upper()
        if trabajador.rol.upper() != current_rol:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes modificar tu propio rol de sistema."
            )
    service = TrabajadorService(session)
    u = service.update_trabajador(trabajador_id, trabajador)
    return _map_to_response(u)

@router.delete("/{trabajador_id}")
def delete_trabajador(
    trabajador_id: int, 
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_active_user)
):
    if current_user.id == trabajador_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propia cuenta de usuario."
        )
    service = TrabajadorService(session)
    return service.delete_trabajador(trabajador_id)

