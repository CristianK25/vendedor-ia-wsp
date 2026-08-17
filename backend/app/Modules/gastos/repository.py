from sqlmodel import Session, select, func
from sqlalchemy.orm import selectinload
from app.Modules.gastos.model import GastoVehiculo
from typing import List, Optional

class GastoRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, gasto_id: int) -> Optional[GastoVehiculo]:
        statement = select(GastoVehiculo).where(GastoVehiculo.id == gasto_id).options(selectinload(GastoVehiculo.usuario))
        return self.session.exec(statement).first()

    def get_by_vehiculo_id(self, vehiculo_id: int) -> List[GastoVehiculo]:
        statement = (
            select(GastoVehiculo)
            .where(GastoVehiculo.vehiculo_id == vehiculo_id)
            .order_by(GastoVehiculo.fecha.desc(), GastoVehiculo.fecha_hora_carga.desc())
            .options(selectinload(GastoVehiculo.usuario))
        )
        return self.session.exec(statement).all()

    def get_totales_vehiculo(self, vehiculo_id: int) -> tuple[float, float]:
        """Devuelve (total_gastos, total_factura_a)"""
        stmt_total = select(func.sum(GastoVehiculo.monto)).where(GastoVehiculo.vehiculo_id == vehiculo_id)
        stmt_fact_a = select(func.sum(GastoVehiculo.monto)).where(GastoVehiculo.vehiculo_id == vehiculo_id).where(GastoVehiculo.factura_a == True)

        total_gastos = self.session.exec(stmt_total).first() or 0.0
        total_factura_a = self.session.exec(stmt_fact_a).first() or 0.0

        return float(total_gastos), float(total_factura_a)

    def create(self, gasto: GastoVehiculo) -> GastoVehiculo:
        self.session.add(gasto)
        self.session.commit()
        self.session.refresh(gasto)
        return gasto

    def update(self, gasto: GastoVehiculo) -> GastoVehiculo:
        self.session.add(gasto)
        self.session.commit()
        self.session.refresh(gasto)
        return gasto

    def delete(self, gasto: GastoVehiculo) -> None:
        self.session.delete(gasto)
        self.session.commit()
