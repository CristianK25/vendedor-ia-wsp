from sqlmodel import Session, select
from app.Modules.vehiculos.model import Vehiculo
from typing import List, Optional

class VehiculoRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self) -> List[Vehiculo]:
        statement = select(Vehiculo)
        return self.session.exec(statement).all()

    def get_by_id(self, vehiculo_id: int) -> Optional[Vehiculo]:
        return self.session.get(Vehiculo, vehiculo_id)

    def get_disponibles(self) -> List[Vehiculo]:
        statement = select(Vehiculo).where(Vehiculo.estado == "disponible")
        return self.session.exec(statement).all()

    def create(self, vehiculo: Vehiculo) -> Vehiculo:
        self.session.add(vehiculo)
        self.session.commit()
        self.session.refresh(vehiculo)
        return vehiculo

    def update(self, vehiculo: Vehiculo) -> Vehiculo:
        self.session.add(vehiculo)
        self.session.commit()
        self.session.refresh(vehiculo)
        return vehiculo

    def delete(self, vehiculo: Vehiculo):
        self.session.delete(vehiculo)
        self.session.commit()
