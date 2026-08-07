from sqlmodel import Session, select, func
from app.Modules.usuarios.model import Usuario
from typing import List, Optional, Tuple

class TrabajadorRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self, skip: int = 0, limit: int = 50, search: str = "") -> Tuple[List[Usuario], int]:
        query = select(Usuario).where(Usuario.es_trabajador == True)
        
        if search:
            query = query.where(
                (Usuario.nombre.ilike(f"%{search}%")) |
                (Usuario.apellido.ilike(f"%{search}%")) |
                (Usuario.telefono.ilike(f"%{search}%")) |
                (Usuario.rol_trabajador.ilike(f"%{search}%"))
            )
            
        total = self.session.exec(select(func.count()).select_from(query.subquery())).one()
        
        query = query.offset(skip).limit(limit)
        items = self.session.exec(query).all()
        return items, total
