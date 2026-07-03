from sqlmodel import Session, select
from app.Modules.clientes.model import Cliente
from typing import List, Optional

class ClienteRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self) -> List[Cliente]:
        statement = select(Cliente)
        return self.session.exec(statement).all()

    def get_by_telefono(self, telefono: str) -> Optional[Cliente]:
        return self.session.get(Cliente, telefono)

    def create(self, cliente: Cliente) -> Cliente:
        self.session.add(cliente)
        self.session.commit()
        self.session.refresh(cliente)
        return cliente

    def update(self, cliente: Cliente) -> Cliente:
        self.session.add(cliente)
        self.session.commit()
        self.session.refresh(cliente)
        return cliente

    def delete(self, cliente: Cliente):
        self.session.delete(cliente)
        self.session.commit()
