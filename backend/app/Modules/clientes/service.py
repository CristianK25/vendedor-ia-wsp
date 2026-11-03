import re
from datetime import timezone
from sqlmodel import Session, select
from fastapi import HTTPException, status
from app.Modules.agent.model import AgentChatMessage
from app.Modules.clientes.repository import ClienteRepository
from app.Modules.clientes.model import Cliente, EstadoConversacion
from app.Modules.clientes.schema import (
    ClienteCreate,
    ClienteUpdate,
    ClienteChatMessageResponse,
    ClienteInteraccionResumenResponse,
    ClienteHistorialChatResponse,
)
from app.Modules.interacciones.model import Interaccion
from app.Modules.vehiculos.model import Vehiculo
from typing import Optional

from app.Core.phone import sanitizar_telefono, sanitizar_nombre

class ClienteService:
    def __init__(self, session: Session):
        self.repository = ClienteRepository(session)
        self.session = session

    def get_all_clientes(
        self,
        skip: int = 0,
        limit: int = 50,
        search: str = "",
        sort_by: str = "",
        sort_dir: str = "asc",
        etiqueta_id: Optional[int] = None,
        estado_conversacion: Optional[str] = None,
    ):
        return self.repository.get_all(
            skip=skip,
            limit=limit,
            search=search,
            sort_by=sort_by,
            sort_dir=sort_dir,
            etiqueta_id=etiqueta_id,
            estado_conversacion=estado_conversacion,
        )

    def get_cliente(self, telefono: str):
        tel_normalizado = sanitizar_telefono(telefono)
        cliente = self.repository.get_by_telefono(tel_normalizado)
        if not cliente:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
        return cliente

    def create_cliente(self, cliente_data: ClienteCreate):
        tel_normalizado = sanitizar_telefono(cliente_data.telefono)
        existente = self.repository.get_by_telefono(tel_normalizado)
        if existente:
            if not existente.activo:
                # Si estaba inactivo, lo reactivamos con la nueva información
                existente.activo = True
                existente.nombre = cliente_data.nombre or existente.nombre
                existente.etiqueta_id = cliente_data.etiqueta_id
                return self.repository.update(existente)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Ya existe un cliente registrado con el número {tel_normalizado}")
        
        datos = cliente_data.model_dump()
        datos["telefono"] = tel_normalizado
        cliente = Cliente(**datos)
        return self.repository.create(cliente)

    def update_cliente(self, telefono: str, cliente_data: ClienteUpdate):
        # Intentamos obtenerlo primero directo por teléfono
        cliente = self.repository.get_by_telefono(telefono)
        if not cliente:
            cliente = self.get_cliente(telefono)
            
        update_data = cliente_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(cliente, key, value)
        return self.repository.update(cliente)

    def marcar_como_atendido(self, telefono: str) -> Cliente:
        """Devuelve el cliente a estado NORMAL y reactiva la atención automática del bot."""
        cliente = self.repository.get_by_telefono(telefono)
        if not cliente:
            cliente = self.get_cliente(telefono)
        cliente.estado_conversacion = EstadoConversacion.NORMAL
        return self.repository.update(cliente)

    def obtener_historial_chat(self, telefono: str, limit: int = 100) -> ClienteHistorialChatResponse:
        """Obtiene el cliente, su historial de mensajes con el agente y el resumen de sus interacciones."""
        cliente = self.repository.get_by_telefono(telefono)
        if not cliente:
            cliente = self.get_cliente(telefono)

        stmt_msgs = (
            select(AgentChatMessage)
            .where(AgentChatMessage.session_id == cliente.telefono)
            .order_by(AgentChatMessage.created_at.asc(), AgentChatMessage.id.asc())
            .limit(limit)
        )
        mensajes_db = self.session.exec(stmt_msgs).all()

        mensajes = [
            ClienteChatMessageResponse(
                id=m.id or 0,
                session_id=m.session_id,
                role=m.role,
                content=m.content,
                camino=m.camino,
                created_at=(
                    m.created_at.replace(tzinfo=timezone.utc)
                    if m.created_at and m.created_at.tzinfo is None
                    else m.created_at
                ),
            )
            for m in mensajes_db
        ]

        stmt_inter = (
            select(Interaccion, Vehiculo)
            .join(Vehiculo, Interaccion.vehiculo_id == Vehiculo.id, isouter=True)
            .where(Interaccion.cliente_telefono == cliente.telefono)
            .order_by(Interaccion.fecha.desc(), Interaccion.id.desc())
            .limit(10)
        )
        inter_rows = self.session.exec(stmt_inter).all()

        interacciones = []
        for inter, vehiculo in inter_rows:
            v_nombre = f"{vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}" if vehiculo else None
            interacciones.append(
                ClienteInteraccionResumenResponse(
                    id=inter.id or 0,
                    tipo=inter.tipo.value if hasattr(inter.tipo, "value") else str(inter.tipo),
                    vehiculo_id=inter.vehiculo_id,
                    vehiculo_nombre=v_nombre,
                    vehiculo_modelo_tasacion=inter.vehiculo_modelo_tasacion,
                    precio_pretendido=inter.precio_pretendido,
                    detalles_tasacion=inter.detalles_tasacion,
                    fecha=(
                        inter.fecha.replace(tzinfo=timezone.utc)
                        if inter.fecha and inter.fecha.tzinfo is None
                        else inter.fecha
                    ),
                )
            )

        return ClienteHistorialChatResponse(
            cliente=cliente.model_dump(),
            mensajes=mensajes,
            interacciones=interacciones,
        )

    def delete_cliente(self, telefono: str):
        from app.Modules.peticiones.model import Peticion

        cliente = self.repository.get_by_telefono(telefono)
        if not cliente:
            cliente = self.get_cliente(telefono)

        # Cancelar peticiones pendientes asociadas a este cliente
        peticiones_vivas = self.session.exec(
            select(Peticion).where(
                Peticion.cliente_telefono == cliente.telefono,
                Peticion.estado.in_(["pendiente_admin", "pendiente_cliente"]),
            )
        ).all()
        for p in peticiones_vivas:
            if p.fecha_propuesta and p.fecha_propuesta.tzinfo is None:
                p.fecha_propuesta = p.fecha_propuesta.replace(tzinfo=timezone.utc)
            p.estado = "cancelada"
            self.session.add(p)

        # Borrado lógico (soft-delete) para no perder historial de citas/ventas
        cliente.activo = False
        self.repository.update(cliente)
        return {"message": "Cliente eliminado correctamente (desactivado)"}
