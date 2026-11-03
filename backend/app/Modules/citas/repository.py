from datetime import date, datetime, time, timedelta, timezone
from sqlmodel import Session, select, func
from app.Modules.citas.model import Cita
from app.Modules.clientes.model import Cliente
from app.Modules.vehiculos.model import Vehiculo
from typing import Optional

class CitaRepository:
    def __init__(self, session: Session):
        self.session = session

    @staticmethod
    def _format_cita_dict(cita: Cita, nombre: Optional[str], marca: Optional[str], modelo: Optional[str], patente: Optional[str]) -> dict:
        cita_dict = cita.model_dump()
        if cita.fecha:
            cita_dict['fecha'] = (
                cita.fecha.replace(tzinfo=timezone.utc)
                if cita.fecha.tzinfo is None
                else cita.fecha.astimezone(timezone.utc)
            )
        cita_dict['cliente_nombre'] = nombre or cita.cliente_telefono
        if modelo:
            cita_dict['vehiculo_modelo'] = f"{marca} {modelo}".strip() if marca else modelo
        if patente:
            cita_dict['vehiculo_patente'] = patente
        return cita_dict

    def get_all(self):
        statement = select(Cita, Cliente.nombre, Vehiculo.marca, Vehiculo.modelo, Vehiculo.patente).join(
            Cliente, Cita.cliente_telefono == Cliente.telefono, isouter=True
        ).join(
            Vehiculo, Cita.vehiculo_id == Vehiculo.id, isouter=True
        )
        results = self.session.exec(statement).all()
        return [
            self._format_cita_dict(cita, nombre, marca, modelo, patente)
            for cita, nombre, marca, modelo, patente in results
        ]

    def get_by_id(self):
        pass

    def get_hoy_by_vehiculo(self, vehiculo_id: int):
        statement = select(Cita, Cliente.nombre, Vehiculo.marca, Vehiculo.modelo, Vehiculo.patente).join(
            Cliente, Cita.cliente_telefono == Cliente.telefono, isouter=True
        ).join(
            Vehiculo, Cita.vehiculo_id == Vehiculo.id, isouter=True
        ).where(
            Cita.vehiculo_id == vehiculo_id,
            func.date(Cita.fecha) == date.today()
        )
        result = self.session.exec(statement).first()
        if not result:
            return None
        cita, nombre, marca, modelo, patente = result
        return self._format_cita_dict(cita, nombre, marca, modelo, patente)

    def get_by_id_with_name(self, cita_id: int):
        statement = select(Cita, Cliente.nombre, Vehiculo.marca, Vehiculo.modelo, Vehiculo.patente).join(
            Cliente, Cita.cliente_telefono == Cliente.telefono, isouter=True
        ).join(
            Vehiculo, Cita.vehiculo_id == Vehiculo.id, isouter=True
        ).where(Cita.id == cita_id)
        result = self.session.exec(statement).first()
        if not result:
            return None
        cita, nombre, marca, modelo, patente = result
        return self._format_cita_dict(cita, nombre, marca, modelo, patente)

    def get_by_id_model(self, cita_id: int) -> Optional[Cita]:
        return self.session.get(Cita, cita_id)

    def check_client_has_cita_on_date(self, telefono: str, target_date: datetime):
        target_utc = (
            target_date.replace(tzinfo=timezone.utc)
            if target_date.tzinfo is None
            else target_date.astimezone(timezone.utc)
        )
        start_of_day = datetime.combine(target_utc.date(), time.min, tzinfo=timezone.utc)
        end_of_day = datetime.combine(target_utc.date(), time.max, tzinfo=timezone.utc)
        
        statement = select(Cita).where(
            Cita.cliente_telefono == telefono,
            Cita.fecha >= start_of_day,
            Cita.fecha <= end_of_day,
            Cita.estado != 'cancelada'
        )
        return self.session.exec(statement).first() is not None

    def check_overlap_exists(self, target_date: datetime, margin_hours: int = 1):
        target_utc = (
            target_date.replace(tzinfo=timezone.utc)
            if target_date.tzinfo is None
            else target_date.astimezone(timezone.utc)
        )
        start_range = target_utc - timedelta(hours=margin_hours)
        end_range = target_utc + timedelta(hours=margin_hours)
        
        statement = select(Cita).where(
            Cita.fecha > start_range,
            Cita.fecha < end_range,
            Cita.estado != 'cancelada'
        )
        return self.session.exec(statement).first() is not None

    def create(self, cita: Cita):
        if cita.fecha and cita.fecha.tzinfo is None:
            cita.fecha = cita.fecha.replace(tzinfo=timezone.utc)
        if cita.fecha_creacion and cita.fecha_creacion.tzinfo is None:
            cita.fecha_creacion = cita.fecha_creacion.replace(tzinfo=timezone.utc)
        self.session.add(cita)
        self.session.commit()
        self.session.refresh(cita)
        return self.get_by_id_with_name(cita.id)

    def update(self, cita: Cita):
        if cita.fecha and cita.fecha.tzinfo is None:
            cita.fecha = cita.fecha.replace(tzinfo=timezone.utc)
        if cita.fecha_creacion and cita.fecha_creacion.tzinfo is None:
            cita.fecha_creacion = cita.fecha_creacion.replace(tzinfo=timezone.utc)
        self.session.add(cita)
        self.session.commit()
        self.session.refresh(cita)
        return self.get_by_id_with_name(cita.id)

    def delete(self, cita: Cita):
        self.session.delete(cita)
        self.session.commit()
