from sqlmodel import Session
from fastapi import HTTPException, status
from app.Modules.promociones.repository import PromocionRepository
from app.Modules.promociones.model import Promocion
from app.Modules.promociones.schema import PromocionCreate, PromocionUpdate

class PromocionService:
    def __init__(self, session: Session):
        self.repository = PromocionRepository(session)

    def get_all_promociones(self):
        return self.repository.get_all()
        
    def get_promociones_activas(self):
        return self.repository.get_activas()

    def get_promocion(self, promocion_id: int):
        promocion = self.repository.get_by_id(promocion_id)
        if not promocion:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promocion no encontrada")
        return promocion

    def create_promocion(self, promocion_data: PromocionCreate):
        promocion = Promocion(**promocion_data.model_dump())
        return self.repository.create(promocion)

    def update_promocion(self, promocion_id: int, promocion_data: PromocionUpdate):
        promocion = self.get_promocion(promocion_id)
        update_data = promocion_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(promocion, key, value)
        return self.repository.update(promocion)

    def delete_promocion(self, promocion_id: int):
        promocion = self.get_promocion(promocion_id)
        self.repository.delete(promocion)
        return {"message": "Promocion eliminada exitosamente"}
