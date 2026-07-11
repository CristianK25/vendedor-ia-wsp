from sqlmodel import Session, select, func
from app.Modules.clientes.model import Cliente
from app.Modules.citas.model import Cita
from typing import List, Optional, Tuple
from datetime import datetime

class ClienteRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self, skip: int = 0, limit: int = 50, search: str = "", sort_by: str = "", sort_dir: str = "asc") -> Tuple[List[dict], int]:
        has_pending_cita = select(Cita.id).where(
            Cita.cliente_telefono == Cliente.telefono,
            Cita.estado == "pendiente",
            Cita.fecha >= datetime.utcnow()
        ).correlate(Cliente).exists()
        
        query = select(Cliente, has_pending_cita)
        
        if search:
            query = query.where(
                (Cliente.nombre.ilike(f"%{search}%")) |
                (Cliente.telefono.ilike(f"%{search}%"))
            )
            
        if sort_by:
            column = getattr(Cliente, sort_by, None)
            if column is not None:
                if sort_dir == "desc":
                    query = query.order_by(column.desc())
                else:
                    query = query.order_by(column.asc())
        else:
            query = query.order_by(Cliente.ultima_interaccion_cliente.desc().nulls_last())
            
        total = self.session.exec(select(func.count()).select_from(query.with_only_columns(Cliente.telefono).subquery())).one()
        
        query = query.offset(skip).limit(limit)
        results = self.session.exec(query).all()
        
        items = []
        for cliente, pending_cita in results:
            c_dict = cliente.model_dump()
            c_dict["tiene_cita_pendiente"] = pending_cita
            items.append(c_dict)
            
        return items, total

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
