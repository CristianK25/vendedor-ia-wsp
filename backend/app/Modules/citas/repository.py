from sqlmodel import Session, select
from app.Modules.citas.model import Cita
from typing import List, Optional

class CitaRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self) -> List[Cita]:
        statement = select(Cita)
        return self.session.exec(statement).all()

    def get_by_id(self, cita_id: int) -> Optional[Cita]:
        return self.session.get(Cita, cita_id)

    def create(self, cita: Cita) -> Cita:
        self.session.add(cita)
        self.session.commit()
        self.session.refresh(cita)
        return cita

    def update(self, cita: Cita) -> Cita:
        self.session.add(cita)
        self.session.commit()
        self.session.refresh(cita)
        return cita

    def delete(self, cita: Cita):
        self.session.delete(cita)
        self.session.commit()
