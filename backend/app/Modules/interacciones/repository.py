from sqlmodel import Session, select
from typing import List, Optional
from app.Modules.interacciones.model import Interaccion

class InteraccionRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self, skip: int = 0, limit: int = 50) -> List[Interaccion]:
        statement = select(Interaccion).offset(skip).limit(limit)
        return self.session.exec(statement).all()

    def get_by_id(self, interaccion_id: int) -> Optional[Interaccion]:
        return self.session.get(Interaccion, interaccion_id)

    def get_by_cliente(self, cliente_telefono: str) -> List[Interaccion]:
        statement = select(Interaccion).where(Interaccion.cliente_telefono == cliente_telefono).order_by(Interaccion.fecha.desc())
        return self.session.exec(statement).all()

    def get_ultima_interaccion_cliente_vehiculo(self, cliente_telefono: str, vehiculo_id: int) -> Optional[Interaccion]:
        statement = select(Interaccion).where(
            Interaccion.cliente_telefono == cliente_telefono,
            Interaccion.vehiculo_id == vehiculo_id
        ).order_by(Interaccion.fecha.desc())
        return self.session.exec(statement).first()

    def get_pendientes_seguimiento(self) -> List[Interaccion]:
        statement = select(Interaccion).where(Interaccion.seguimiento_completado == False)
        return self.session.exec(statement).all()

    def add(self, interaccion: Interaccion) -> Interaccion:
        self.session.add(interaccion)
        self.session.commit()
        self.session.refresh(interaccion)
        return interaccion

    def update(self, interaccion: Interaccion) -> Interaccion:
        self.session.add(interaccion)
        self.session.commit()
        self.session.refresh(interaccion)
        return interaccion
