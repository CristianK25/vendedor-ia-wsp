from sqlmodel import Session, select, func
from app.Modules.citas.model import Cita
from app.Modules.clientes.model import Cliente
from app.Modules.vehiculos.model import Vehiculo
from typing import List, Optional

class CitaRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self):
        statement = select(Cita, Cliente.nombre, Vehiculo.modelo, Vehiculo.patente).join(
            Cliente, Cita.cliente_telefono == Cliente.telefono, isouter=True
        ).join(
            Vehiculo, Cita.vehiculo_id == Vehiculo.id, isouter=True
        )
        results = self.session.exec(statement).all()
        
        citas_with_name = []
        for cita, nombre, modelo, patente in results:
            cita_dict = cita.model_dump()
            cita_dict['cliente_nombre'] = nombre or cita.cliente_telefono
            if modelo:
                cita_dict['vehiculo_modelo'] = modelo
            if patente:
                cita_dict['vehiculo_patente'] = patente
            citas_with_name.append(cita_dict)
        return citas_with_name

    def get_by_id(self):
        # get_by_id is not changed because it's only used for internal operations in service
        pass

    def get_hoy_by_vehiculo(self, vehiculo_id: int):
        from datetime import date
        statement = select(Cita, Cliente.nombre, Vehiculo.modelo, Vehiculo.patente).join(
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
        cita, nombre, modelo, patente = result
        cita_dict = cita.model_dump()
        cita_dict['cliente_nombre'] = nombre or cita.cliente_telefono
        if modelo:
            cita_dict['vehiculo_modelo'] = modelo
        if patente:
            cita_dict['vehiculo_patente'] = patente
        return cita_dict

    def get_by_id_with_name(self, cita_id: int):
        statement = select(Cita, Cliente.nombre, Vehiculo.modelo, Vehiculo.patente).join(
            Cliente, Cita.cliente_telefono == Cliente.telefono, isouter=True
        ).join(
            Vehiculo, Cita.vehiculo_id == Vehiculo.id, isouter=True
        ).where(Cita.id == cita_id)
        result = self.session.exec(statement).first()
        if not result:
            return None
        cita, nombre, modelo, patente = result
        cita_dict = cita.model_dump()
        cita_dict['cliente_nombre'] = nombre or cita.cliente_telefono
        if modelo:
            cita_dict['vehiculo_modelo'] = modelo
        if patente:
            cita_dict['vehiculo_patente'] = patente
        return cita_dict

    def get_by_id_model(self, cita_id: int) -> Optional[Cita]:
        return self.session.get(Cita, cita_id)

    def check_client_has_cita_on_date(self, telefono: str, target_date):
        from datetime import datetime, time
        start_of_day = datetime.combine(target_date.date(), time.min)
        end_of_day = datetime.combine(target_date.date(), time.max)
        
        statement = select(Cita).where(
            Cita.cliente_telefono == telefono,
            Cita.fecha >= start_of_day,
            Cita.fecha <= end_of_day,
            Cita.estado != 'cancelada'
        )
        return self.session.exec(statement).first() is not None

    def check_overlap_exists(self, target_date, margin_hours: int = 1):
        from datetime import timedelta
        start_range = target_date - timedelta(hours=margin_hours)
        end_range = target_date + timedelta(hours=margin_hours)
        
        statement = select(Cita).where(
            Cita.fecha > start_range,
            Cita.fecha < end_range,
            Cita.estado != 'cancelada'
        )
        return self.session.exec(statement).first() is not None

    def create(self, cita: Cita):
        self.session.add(cita)
        self.session.commit()
        self.session.refresh(cita)
        return self.get_by_id_with_name(cita.id)

    def update(self, cita: Cita):
        self.session.add(cita)
        self.session.commit()
        self.session.refresh(cita)
        return self.get_by_id_with_name(cita.id)

    def delete(self, cita: Cita):
        self.session.delete(cita)
        self.session.commit()
