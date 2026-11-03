from sqlmodel import Session, select, func, case
from app.Modules.clientes.model import Cliente, EstadoConversacion
from app.Modules.citas.model import Cita
from app.Modules.etiquetas.model import Etiqueta
from typing import List, Optional, Tuple
from datetime import datetime, timezone

class ClienteRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(
        self,
        skip: int = 0,
        limit: int = 50,
        search: str = "",
        sort_by: str = "",
        sort_dir: str = "asc",
        etiqueta_id: Optional[int] = None,
        estado_conversacion: Optional[str] = None,
    ) -> Tuple[List[dict], int, int]:
        ahora_utc = datetime.now(timezone.utc)
        has_pending_cita = select(Cita.id).where(
            Cita.cliente_telefono == Cliente.telefono,
            Cita.estado == "pendiente",
            Cita.fecha >= ahora_utc
        ).correlate(Cliente).exists()
        
        query = select(Cliente, has_pending_cita, Etiqueta).join(
            Etiqueta, Cliente.etiqueta_id == Etiqueta.id, isouter=True
        ).where(Cliente.activo == True)
        
        if search:
            query = query.where(
                (Cliente.nombre.ilike(f"%{search}%")) |
                (Cliente.telefono.ilike(f"%{search}%"))
            )
            
        if etiqueta_id == 0:
            query = query.where(Cliente.etiqueta_id == None)
        elif etiqueta_id is not None:
            query = query.where(Cliente.etiqueta_id == etiqueta_id)

        if estado_conversacion:
            query = query.where(Cliente.estado_conversacion == estado_conversacion)
            
        if sort_by:
            column = getattr(Cliente, sort_by, None)
            if column is not None:
                if sort_dir == "desc":
                    query = query.order_by(column.desc())
                else:
                    query = query.order_by(column.asc())
        else:
            # Priorizar primero los clientes que requieren atención humana (REQUIERE_HUMANO)
            prioridad_humano = case(
                (Cliente.estado_conversacion == EstadoConversacion.REQUIERE_HUMANO, 0),
                else_=1,
            )
            query = query.order_by(
                prioridad_humano.asc(),
                Cliente.ultima_interaccion_cliente.desc().nulls_last(),
            )
            
        total = self.session.exec(
            select(func.count()).select_from(query.with_only_columns(Cliente.telefono).subquery())
        ).one()

        requiere_humano_count = self.session.exec(
            select(func.count(Cliente.telefono)).where(
                Cliente.activo == True,
                Cliente.estado_conversacion == EstadoConversacion.REQUIERE_HUMANO,
            )
        ).one()
        
        query = query.offset(skip).limit(limit)
        results = self.session.exec(query).all()
        
        items = []
        for cliente, pending_cita, etiqueta in results:
            c_dict = cliente.model_dump()
            c_dict["tiene_cita_pendiente"] = pending_cita
            if etiqueta:
                c_dict["etiqueta"] = etiqueta.model_dump()
            items.append(c_dict)
            
        return items, total, requiere_humano_count

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
