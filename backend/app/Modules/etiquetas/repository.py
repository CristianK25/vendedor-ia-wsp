from sqlmodel import Session, select, func
from app.Modules.etiquetas.model import Etiqueta
from app.Modules.clientes.model import Cliente
from typing import List, Optional, Tuple

class EtiquetaRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self) -> List[dict]:
        query = select(Etiqueta, func.count(Cliente.telefono)).join(
            Cliente, Etiqueta.id == Cliente.etiqueta_id, isouter=True
        ).group_by(Etiqueta.id)
        
        results = self.session.exec(query).all()
        
        items = []
        for etiqueta, cantidad in results:
            e_dict = etiqueta.model_dump()
            e_dict["cantidad_clientes"] = cantidad
            items.append(e_dict)
            
        return items

    def get_by_id(self, etiqueta_id: int) -> Optional[Etiqueta]:
        return self.session.get(Etiqueta, etiqueta_id)
        
    def get_by_nombre(self, nombre: str) -> Optional[Etiqueta]:
        return self.session.exec(select(Etiqueta).where(Etiqueta.nombre == nombre)).first()

    def create(self, etiqueta: Etiqueta) -> Etiqueta:
        self.session.add(etiqueta)
        self.session.commit()
        self.session.refresh(etiqueta)
        return etiqueta

    def update(self, etiqueta: Etiqueta) -> Etiqueta:
        self.session.add(etiqueta)
        self.session.commit()
        self.session.refresh(etiqueta)
        return etiqueta

    def delete(self, etiqueta: Etiqueta):
        self.session.delete(etiqueta)
        self.session.commit()
