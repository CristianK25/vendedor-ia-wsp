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

def sanitizar_telefono(telefono: str) -> str:
    """
    Normaliza el número de teléfono al formato estándar internacional de WhatsApp.
    Para Argentina: 549 + 10 dígitos (ej: 5492614720339).
    """
    if not telefono:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El teléfono no puede estar vacío")
    
    # Dejar solo dígitos
    limpio = re.sub(r"\D", "", str(telefono).strip())
    
    if not limpio:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El número de teléfono es inválido")

    # Si empieza con 549 y tiene 13 dígitos, está perfecto
    if limpio.startswith("549") and len(limpio) == 13:
        return limpio
    
    # Si empieza con 54 (sin 9) y tiene 12 dígitos (ej: 542614720339) -> 5492614720339
    if limpio.startswith("54") and len(limpio) == 12:
        return f"549{limpio[2:]}"
        
    # Si empieza con 0 (ej: 0261...)
    if limpio.startswith("0"):
        limpio = limpio[1:]
        
    # Si tras quitar el 0 quedan 10 dígitos (ej: 2614720339), anteponemos 549
    if len(limpio) == 10:
        return f"549{limpio}"
        
    # Si tiene 12 dígitos y contiene '15' tras código de área de 2, 3 o 4 dígitos (ej: 261154720339)
    for area_len in [2, 3, 4]:
        if len(limpio) == 12 and limpio[area_len:area_len+2] == "15":
            sin_15 = limpio[:area_len] + limpio[area_len+2:]
            if len(sin_15) == 10:
                return f"549{sin_15}"

    # Si ya tiene entre 10 y 15 dígitos
    if 10 <= len(limpio) <= 15:
        if len(limpio) == 10:
            return f"549{limpio}"
        return limpio
        
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST, 
        detail="El formato del teléfono no es válido. Debe tener entre 10 y 15 dígitos."
    )

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
        cliente = self.repository.get_by_telefono(telefono)
        if not cliente:
            cliente = self.get_cliente(telefono)
        # Borrado lógico (soft-delete) para no perder historial de citas/ventas
        cliente.activo = False
        self.repository.update(cliente)
        return {"message": "Cliente eliminado correctamente (desactivado)"}
