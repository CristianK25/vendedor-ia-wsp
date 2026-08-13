from sqlmodel import Session
from fastapi import HTTPException, status
from typing import List
from app.Modules.interacciones.repository import InteraccionRepository
from app.Modules.interacciones.model import Interaccion
from app.Modules.interacciones.schema import InteraccionCreate, InteraccionUpdate

class InteraccionService:
    def __init__(self, session: Session):
        self.repository = InteraccionRepository(session)

    def get_all(self, skip: int = 0, limit: int = 50) -> List[Interaccion]:
        return self.repository.get_all(skip, limit)

    def get_by_cliente(self, cliente_telefono: str) -> List[Interaccion]:
        return self.repository.get_by_cliente(cliente_telefono)

    def get_ultima_interaccion_cliente_vehiculo(self, cliente_telefono: str, vehiculo_id: int) -> Interaccion:
        return self.repository.get_ultima_interaccion_cliente_vehiculo(cliente_telefono, vehiculo_id)

    def create(self, interaccion_data: InteraccionCreate) -> Interaccion:
        # Validar si el cliente existe, etc, si fuera estrictamente necesario
        # Por ahora creamos la entidad base
        interaccion = Interaccion(**interaccion_data.model_dump(exclude_unset=True))
        return self.repository.add(interaccion)

    def update(self, interaccion_id: int, interaccion_data: InteraccionUpdate) -> Interaccion:
        interaccion = self.repository.get_by_id(interaccion_id)
        if not interaccion:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interacción no encontrada")
        
        update_data = interaccion_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(interaccion, key, value)
            
        return self.repository.update(interaccion)
