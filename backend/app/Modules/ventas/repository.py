from sqlmodel import Session, select
from app.Modules.ventas.model import Venta
from typing import List, Optional

class VentaRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self) -> List[Venta]:
        statement = select(Venta)
        return self.session.exec(statement).all()

    def get_by_id(self, venta_id: int) -> Optional[Venta]:
        return self.session.get(Venta, venta_id)

    def create(self, venta: Venta) -> Venta:
        self.session.add(venta)
        self.session.commit()
        self.session.refresh(venta)
        return venta
