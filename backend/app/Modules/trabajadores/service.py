from sqlmodel import Session
from fastapi import HTTPException, status
from app.Modules.trabajadores.repository import TrabajadorRepository
from app.Modules.usuarios.service import UsuarioService
from app.Modules.usuarios.schema import UsuarioCreate, UsuarioUpdate

class TrabajadorService:
    def __init__(self, session: Session):
        self.repository = TrabajadorRepository(session)
        self.usuario_service = UsuarioService(session)

    def get_all_trabajadores(self, skip: int = 0, limit: int = 50, search: str = ""):
        return self.repository.get_all(skip, limit, search)

    def get_trabajador(self, trabajador_id: int):
        trabajador = self.usuario_service.repository.get_by_id(trabajador_id)
        if not trabajador or not trabajador.es_trabajador:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trabajador no encontrado")
        return trabajador

    def create_trabajador(self, trabajador_data: UsuarioCreate):
        # Force es_trabajador to True when creating through the worker endpoint
        trabajador_data.es_trabajador = True
        return self.usuario_service.create_usuario_admin(trabajador_data)

    def update_trabajador(self, trabajador_id: int, trabajador_data: UsuarioUpdate):
        # Ensure we only update if it is a worker
        self.get_trabajador(trabajador_id)
        return self.usuario_service.update_usuario_admin(trabajador_id, trabajador_data)

    def delete_trabajador(self, trabajador_id: int):
        # Ensure we only delete if it is a worker
        self.get_trabajador(trabajador_id)
        return self.usuario_service.delete_usuario_admin(trabajador_id)

