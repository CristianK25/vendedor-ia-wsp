from sqlmodel import Session
from fastapi import HTTPException, status
from app.Modules.trabajadores.repository import TrabajadorRepository
from app.Modules.trabajadores.model import Trabajador
from app.Modules.trabajadores.schema import TrabajadorCreate, TrabajadorUpdate

class TrabajadorService:
    def __init__(self, session: Session):
        self.repository = TrabajadorRepository(session)

    def get_all_trabajadores(self, skip: int = 0, limit: int = 50, search: str = ""):
        return self.repository.get_all(skip, limit, search)

    def get_trabajador(self, trabajador_id: int):
        trabajador = self.repository.get_by_id(trabajador_id)
        if not trabajador:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trabajador no encontrado")
        return trabajador

    def create_trabajador(self, trabajador_data: TrabajadorCreate):
        if self.repository.get_by_telefono(trabajador_data.telefono):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe un trabajador con este telefono")
        trabajador = Trabajador(**trabajador_data.model_dump())
        return self.repository.create(trabajador)

    def update_trabajador(self, trabajador_id: int, trabajador_data: TrabajadorUpdate):
        trabajador = self.get_trabajador(trabajador_id)
        update_data = trabajador_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(trabajador, key, value)
        return self.repository.update(trabajador)

    def delete_trabajador(self, trabajador_id: int):
        trabajador = self.get_trabajador(trabajador_id)
        self.repository.delete(trabajador)
        return {"message": "Trabajador eliminado exitosamente"}
