from sqlmodel import Session, select, func
from app.Modules.ventas.model import Venta
from app.Modules.vehiculos.model import Vehiculo
from app.Modules.clientes.model import Cliente
from typing import List, Optional, Tuple

class VentaRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self, skip: int = 0, limit: int = 50, search: str = "", sort_by: str = "", sort_dir: str = "asc") -> Tuple[List[dict], int]:
        query = select(Venta, Vehiculo.modelo, Cliente.nombre).join(
            Vehiculo, Venta.vehiculo_id == Vehiculo.id
        ).join(
            Cliente, Venta.cliente_telefono == Cliente.telefono
        ).where(Venta.activo == True)
        
        if search:
            query = query.where(
                (Venta.cliente_telefono.ilike(f"%{search}%")) |
                (Vehiculo.modelo.ilike(f"%{search}%")) |
                (Cliente.nombre.ilike(f"%{search}%"))
            )
            
        if sort_by:
            if sort_by in ["vehiculo_id", "vehiculo_modelo", "modelo", "vehiculo"]:
                column = Vehiculo.modelo
            elif sort_by in ["cliente_telefono", "cliente_nombre", "cliente"]:
                column = Cliente.nombre
            else:
                column = getattr(Venta, sort_by, None)
                
            if column is not None:
                if sort_dir == "desc":
                    query = query.order_by(column.desc())
                else:
                    query = query.order_by(column.asc())
        else:
            query = query.order_by(Venta.fecha.desc())
            
        total = self.session.exec(select(func.count()).select_from(query.subquery())).one()
        
        query = query.offset(skip).limit(limit)
        results = self.session.exec(query).all()
        
        items = []
        for venta, vehiculo_modelo, cliente_nombre in results:
            venta_dict = venta.model_dump()
            venta_dict["vehiculo_modelo"] = vehiculo_modelo
            venta_dict["tipo_venta"] = venta.tipo_venta
            venta_dict["cliente_nombre"] = cliente_nombre
            items.append(venta_dict)
            
        return items, total

    def get_by_id(self, venta_id: int) -> Optional[Venta]:
        venta = self.session.get(Venta, venta_id)
        return venta if venta and venta.activo else None

    def get_by_vehiculo_id(self, vehiculo_id: int) -> Optional[Venta]:
        statement = select(Venta).where(Venta.vehiculo_id == vehiculo_id).where(Venta.activo == True)
        return self.session.exec(statement).first()

    def create(self, venta: Venta) -> Venta:
        self.session.add(venta)
        self.session.commit()
        self.session.refresh(venta)
        return venta
