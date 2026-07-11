from sqlmodel import Session, select, func
from app.Modules.trabajadores.model import Trabajador
from typing import List, Optional, Tuple

class TrabajadorRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self, skip: int = 0, limit: int = 50, search: str = "") -> Tuple[List[Trabajador], int]:
        query = select(Trabajador)
        
        if search:
            query = query.where(
                (Trabajador.nombre.ilike(f"%{search}%")) |
                (Trabajador.telefono.ilike(f"%{search}%")) |
                (Trabajador.rol.ilike(f"%{search}%"))
            )
            
        total = self.session.exec(select(func.count()).select_from(query.subquery())).one()
        
        query = query.offset(skip).limit(limit)
        items = self.session.exec(query).all()
        return items, total

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
