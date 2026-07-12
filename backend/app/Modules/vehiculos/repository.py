from sqlmodel import Session, select, func
from app.Modules.vehiculos.model import Vehiculo
from typing import List, Optional, Tuple

class VehiculoRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self, skip: int = 0, limit: int = 50, search: str = "", estado: str = "", sort_by: str = "", sort_dir: str = "asc") -> Tuple[List[Vehiculo], int]:
        query = select(Vehiculo)
        
        if search:
            query = query.where(Vehiculo.modelo.ilike(f"%{search}%"))
            
        if estado:
            query = query.where(Vehiculo.estado == estado)
            
        if sort_by:
            column = getattr(Vehiculo, sort_by, None)
            if column is not None:
                if sort_dir == "desc":
                    query = query.order_by(column.desc())
                else:
                    query = query.order_by(column.asc())
                    
        total = self.session.exec(select(func.count()).select_from(query.subquery())).one()
        
        query = query.offset(skip).limit(limit)
        items = self.session.exec(query).all()
        
        return items, total

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
