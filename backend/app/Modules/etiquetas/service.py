from sqlmodel import Session
from fastapi import HTTPException, status
from app.Modules.etiquetas.repository import EtiquetaRepository
from app.Modules.etiquetas.model import Etiqueta
from app.Modules.etiquetas.schema import EtiquetaCreate, EtiquetaUpdate

class EtiquetaService:
    def __init__(self, session: Session):
        self.repository = EtiquetaRepository(session)

    def get_all_etiquetas(self):
        return self.repository.get_all()

    def get_etiqueta(self, etiqueta_id: int):
        etiqueta = self.repository.get_by_id(etiqueta_id)
        if not etiqueta:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Etiqueta no encontrada")
        return etiqueta

    def create_etiqueta(self, etiqueta_data: EtiquetaCreate):
        if self.repository.get_by_nombre(etiqueta_data.nombre):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe una etiqueta con este nombre")
        etiqueta = Etiqueta(**etiqueta_data.model_dump())
        return self.repository.create(etiqueta)

    def update_etiqueta(self, etiqueta_id: int, etiqueta_data: EtiquetaUpdate):
        etiqueta = self.get_etiqueta(etiqueta_id)
        
        if etiqueta_data.nombre and etiqueta_data.nombre != etiqueta.nombre:
            if self.repository.get_by_nombre(etiqueta_data.nombre):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe una etiqueta con este nombre")
                
        update_data = etiqueta_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(etiqueta, key, value)
        return self.repository.update(etiqueta)

    def delete_etiqueta(self, etiqueta_id: int):
        etiqueta = self.get_etiqueta(etiqueta_id)
        self.repository.delete(etiqueta)
        return {"detail": "Etiqueta eliminada correctamente"}
