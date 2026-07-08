from sqlmodel import Session, select
from app.Modules.citas.model import Cita
from app.Modules.clientes.model import Cliente
from typing import List, Optional

class CitaRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self):
        statement = select(Cita, Cliente.nombre).join(Cliente, Cita.cliente_telefono == Cliente.telefono, isouter=True)
        results = self.session.exec(statement).all()
        
        citas_with_name = []
        for cita, nombre in results:
            cita_dict = cita.model_dump()
            cita_dict['cliente_nombre'] = nombre or cita.cliente_telefono
            citas_with_name.append(cita_dict)
        return citas_with_name

    def get_by_id(self):
        # get_by_id is not changed because it's only used for internal operations in service
        pass

    def get_by_id_with_name(self, cita_id: int):
        statement = select(Cita, Cliente.nombre).join(Cliente, Cita.cliente_telefono == Cliente.telefono, isouter=True).where(Cita.id == cita_id)
        result = self.session.exec(statement).first()
        if not result:
            return None
        cita, nombre = result
        cita_dict = cita.model_dump()
        cita_dict['cliente_nombre'] = nombre or cita.cliente_telefono
        return cita_dict

    def get_by_id_model(self, cita_id: int) -> Optional[Cita]:
        return self.session.get(Cita, cita_id)

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
