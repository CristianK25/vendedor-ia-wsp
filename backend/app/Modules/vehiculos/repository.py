from sqlmodel import Session, select, func
from app.Modules.vehiculos.model import Vehiculo
from typing import List, Optional, Tuple
from sqlalchemy.orm import selectinload

class VehiculoRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(
        self, 
        skip: int = 0, 
        limit: int = 50, 
        search: str = "", 
        estado: str = "", 
        precio_min: Optional[float] = None,
        precio_max: Optional[float] = None,
        km_min: Optional[int] = None,
        km_max: Optional[int] = None,
        anio_min: Optional[int] = None,
        anio_max: Optional[int] = None,
        transmision: str = "",
        traccion: str = "",
        tipo: str = "",
        condicion: str = "",
        sort_by: str = "", 
        sort_dir: str = "asc"
    ) -> Tuple[List[Vehiculo], int]:
        query = select(Vehiculo).where(Vehiculo.activo == True).options(selectinload(Vehiculo.imagenes))
        
        if search:
            words = [w.strip() for w in search.strip().split() if w.strip()]
            for word in words:
                query = query.where(
                    (Vehiculo.modelo.ilike(f"%{word}%")) |
                    (Vehiculo.marca.ilike(f"%{word}%")) |
                    (Vehiculo.patente.ilike(f"%{word}%"))
                )
            
        if estado:
            query = query.where(Vehiculo.estado == estado)
            
        if precio_min is not None:
            query = query.where(Vehiculo.precio_venta >= precio_min)
        if precio_max is not None:
            query = query.where(Vehiculo.precio_venta <= precio_max)
            
        if km_min is not None:
            query = query.where(Vehiculo.kilometraje >= km_min)
        if km_max is not None:
            query = query.where(Vehiculo.kilometraje <= km_max)
            
        if anio_min is not None:
            query = query.where(Vehiculo.anio >= anio_min)
        if anio_max is not None:
            query = query.where(Vehiculo.anio <= anio_max)
            
        if transmision:
            query = query.where(Vehiculo.transmision == transmision)
            
        if traccion:
            query = query.where(Vehiculo.traccion == traccion)
            
        if tipo:
            query = query.where(Vehiculo.tipo == tipo)
            
        if condicion:
            query = query.where(Vehiculo.condicion == condicion)
            
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

    def get_stats(self) -> dict:
        statement = select(
            func.min(Vehiculo.precio_venta).label("precio_min"),
            func.max(Vehiculo.precio_venta).label("precio_max"),
            func.min(Vehiculo.kilometraje).label("km_min"),
            func.max(Vehiculo.kilometraje).label("km_max"),
            func.min(Vehiculo.anio).label("anio_min"),
            func.max(Vehiculo.anio).label("anio_max"),
        ).where(Vehiculo.activo == True)
        result = self.session.exec(statement).first()
        
        return {
            "precio_min": result.precio_min or 0,
            "precio_max": result.precio_max or 100000,
            "km_min": result.km_min or 0,
            "km_max": result.km_max or 200000,
            "anio_min": result.anio_min or 2000,
            "anio_max": result.anio_max or 2025,
        }

    def get_by_id(self, vehiculo_id: int) -> Optional[Vehiculo]:
        vehiculo = self.session.get(Vehiculo, vehiculo_id)
        return vehiculo if vehiculo and vehiculo.activo else None

    def get_disponibles(self) -> List[Vehiculo]:
        statement = select(Vehiculo).where(Vehiculo.estado == "disponible").where(Vehiculo.activo == True).options(selectinload(Vehiculo.imagenes))
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
