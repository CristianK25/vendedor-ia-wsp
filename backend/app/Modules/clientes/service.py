from sqlmodel import Session
from fastapi import HTTPException, status
from app.Modules.clientes.repository import ClienteRepository
from app.Modules.clientes.model import Cliente
from app.Modules.clientes.schema import ClienteCreate, ClienteUpdate
from typing import Optional

class ClienteService:
    def __init__(self, session: Session):
        self.repository = ClienteRepository(session)

    def get_all_clientes(self, skip: int = 0, limit: int = 50, search: str = "", sort_by: str = "", sort_dir: str = "asc", etiqueta_id: Optional[int] = None):
        return self.repository.get_all(skip, limit, search, sort_by, sort_dir, etiqueta_id)

    def get_cliente(self, telefono: str):
        cliente = self.repository.get_by_telefono(telefono)
        if not cliente:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
        return cliente

    def create_cliente(self, cliente_data: ClienteCreate):
        if self.repository.get_by_telefono(cliente_data.telefono):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El cliente ya existe")
        cliente = Cliente(**cliente_data.model_dump())
        return self.repository.create(cliente)

    def update_cliente(self, telefono: str, cliente_data: ClienteUpdate):
        cliente = self.get_cliente(telefono)
        update_data = cliente_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(cliente, key, value)
        return self.repository.update(cliente)
