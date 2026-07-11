from sqlmodel import Session
from fastapi import HTTPException, status
from app.Modules.citas.repository import CitaRepository
from app.Modules.citas.model import Cita
from app.Modules.citas.schema import CitaCreate, CitaUpdate

class CitaService:
    def __init__(self, session: Session):
        self.repository = CitaRepository(session)

    def get_all_citas(self):
        return self.repository.get_all()

    def get_cita_hoy_por_vehiculo(self, vehiculo_id: int):
        return self.repository.get_hoy_by_vehiculo(vehiculo_id)

    def get_cita(self, cita_id: int):
        cita = self.repository.get_by_id_with_name(cita_id)
        if not cita:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cita no encontrada")
        return cita

    def create_cita(self, cita_data: CitaCreate):
        cita = Cita(**cita_data.model_dump())
        return self.repository.create(cita)

    def update_cita(self, cita_id: int, cita_data: CitaUpdate):
        cita = self.repository.get_by_id_model(cita_id)
        if not cita:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cita no encontrada")
        update_data = cita_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(cita, key, value)
        return self.repository.update(cita)

    def delete_cita(self, cita_id: int):
        cita = self.repository.get_by_id_model(cita_id)
        if not cita:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cita no encontrada")
        self.repository.delete(cita)
        return {"message": "Cita eliminada exitosamente"}
