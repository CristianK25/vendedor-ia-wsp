from sqlmodel import Session, select
from app.Modules.trabajadores.model import Trabajador
from typing import List, Optional

class TrabajadorRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self) -> List[Trabajador]:
        statement = select(Trabajador)
        return self.session.exec(statement).all()

    def get_by_id(self, trabajador_id: int) -> Optional[Trabajador]:
        return self.session.get(Trabajador, trabajador_id)

    def get_by_telefono(self, telefono: str) -> Optional[Trabajador]:
        statement = select(Trabajador).where(Trabajador.telefono == telefono)
        return self.session.exec(statement).first()

    def create(self, trabajador: Trabajador) -> Trabajador:
        self.session.add(trabajador)
        self.session.commit()
        self.session.refresh(trabajador)
        return trabajador

    def update(self, trabajador: Trabajador) -> Trabajador:
        self.session.add(trabajador)
        self.session.commit()
        self.session.refresh(trabajador)
        return trabajador

    def delete(self, trabajador: Trabajador):
        self.session.delete(trabajador)
        self.session.commit()
