from sqlmodel import Session
from fastapi import HTTPException, status
from app.Modules.vehiculos.repository import VehiculoRepository
from app.Modules.vehiculos.model import Vehiculo
from app.Modules.vehiculos.schema import VehiculoCreate, VehiculoUpdate

class VehiculoService:
    def __init__(self, session: Session):
        self.repository = VehiculoRepository(session)

    def get_all_vehiculos(self):
        return self.repository.get_all()
    
    def get_disponibles(self):
        return self.repository.get_disponibles()

    def get_vehiculo(self, vehiculo_id: int):
        vehiculo = self.repository.get_by_id(vehiculo_id)
        if not vehiculo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehiculo no encontrado")
        return vehiculo

    def create_vehiculo(self, vehiculo_data: VehiculoCreate):
        vehiculo = Vehiculo(**vehiculo_data.model_dump())
        return self.repository.create(vehiculo)

    def update_vehiculo(self, vehiculo_id: int, vehiculo_data: VehiculoUpdate):
        vehiculo = self.get_vehiculo(vehiculo_id)
        update_data = vehiculo_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(vehiculo, key, value)
        return self.repository.update(vehiculo)

    def delete_vehiculo(self, vehiculo_id: int):
        vehiculo = self.get_vehiculo(vehiculo_id)
        self.repository.delete(vehiculo)
        return {"message": "Vehiculo eliminado exitosamente"}
