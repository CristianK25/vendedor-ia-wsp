from sqlmodel import Session, select
from app.Modules.promociones.model import Promocion
from typing import List, Optional

class PromocionRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self) -> List[Promocion]:
        statement = select(Promocion)
        return self.session.exec(statement).all()

    def get_activas(self) -> List[Promocion]:
        statement = select(Promocion).where(Promocion.estado == "activa")
        return self.session.exec(statement).all()

    def get_by_id(self, promocion_id: int) -> Optional[Promocion]:
        return self.session.get(Promocion, promocion_id)

    def create(self, promocion: Promocion) -> Promocion:
        self.session.add(promocion)
        self.session.commit()
        self.session.refresh(promocion)
        return promocion

    def update(self, promocion: Promocion) -> Promocion:
        self.session.add(promocion)
        self.session.commit()
        self.session.refresh(promocion)
        return promocion

    def delete(self, promocion: Promocion):
        self.session.delete(promocion)
        self.session.commit()
