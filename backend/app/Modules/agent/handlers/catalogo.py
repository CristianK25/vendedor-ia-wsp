import logging
from typing import List, Optional, Set, Tuple
from sqlmodel import Session, select

from app.Modules.clientes.model import Cliente
from app.Modules.interacciones.model import Interaccion, TipoIntencion
from app.Modules.vehiculos.model import EstadoVehiculo, Vehiculo
from app.Modules.agent.handlers.base import BaseHandler
from app.Modules.agent.llm import LLMClient, llm_client
from app.Modules.agent.prompts import DATOS_VENTA_MAXI, PROMPT_CATALOGO_TEMPLATE
from app.Modules.agent.schema import (
    AgentChatRequest,
    AgentChatResponse,
    Camino,
    ChatTurn,
    DecisionCatalogo,
)

logger = logging.getLogger("agent.catalogo")


class CatalogoHandler(BaseHandler):
    """Manejador especializado en el camino de Catálogo y Stock."""

    def __init__(self, llm: LLMClient = llm_client):
        self.llm = llm

    @staticmethod
    def obtener_stock_resumen(session: Session) -> Tuple[str, Set[int]]:
        """
        Consulta el stock activo en PostgreSQL (tanto 'disponible' como 'reservado'/señado)
        de forma determinística y retorna el texto para el prompt junto con los IDs válidos.
        """
        statement = (
            select(Vehiculo)
            .where(
                Vehiculo.estado.in_([EstadoVehiculo.disponible, EstadoVehiculo.reservado]),
                Vehiculo.activo.is_(True),
            )
            .order_by(Vehiculo.estado.asc(), Vehiculo.marca.asc(), Vehiculo.modelo.asc(), Vehiculo.anio.desc())
        )
        vehiculos = session.exec(statement).all()

        if not vehiculos:
            return "Actualmente no hay vehículos cargados en stock.", set()

        lineas: list[str] = []
        ids_validos: set[int] = set()

        for v in vehiculos:
            if v.id is not None:
                ids_validos.add(v.id)

            estado_tag = "[DISPONIBLE]" if v.estado == EstadoVehiculo.disponible else "[SEÑADO]"
            moneda = v.moneda_venta.value if v.moneda_venta else "PESOS"
            if moneda == "USD":
                precio_str = f"USD {v.precio_venta:,.0f}"
            else:
                precio_str = f"${v.precio_venta:,.0f}".replace(",", ".")

            tipo_desc = f" ({v.tipo})" if v.tipo else ""
            lineas.append(
                f"- [ID: {v.id}] {estado_tag} {v.marca} {v.modelo} {v.anio} | {v.kilometraje:,} km | {precio_str} | Transmisión: {v.transmision}{tipo_desc}"
            )

        return "\n".join(lineas), ids_validos

    @staticmethod
    def _registrar_interes_vehiculo(
        session: Session,
        cliente_telefono: str,
        cliente_nombre: Optional[str],
        vehiculo_id: int,
    ) -> None:
        """
        Registra en la tabla `interacciones` que el cliente consultó por `vehiculo_id`
        (si aún no tiene una interacción de compra registrada para ese mismo auto).
        """
        # Asegurar que el cliente exista en la tabla `clientes` por la FK de `interacciones`
        cliente = session.get(Cliente, cliente_telefono)
        if not cliente:
            cliente = Cliente(
                telefono=cliente_telefono,
                nombre=cliente_nombre or "Cliente WhatsApp",
                activo=True,
            )
            session.add(cliente)
            session.flush()

        stmt_existente = (
            select(Interaccion)
            .where(
                Interaccion.cliente_telefono == cliente_telefono,
                Interaccion.vehiculo_id == vehiculo_id,
                Interaccion.tipo == TipoIntencion.compra,
            )
            .limit(1)
        )
        interaccion_previa = session.exec(stmt_existente).first()
        if not interaccion_previa:
            nueva = Interaccion(
                cliente_telefono=cliente_telefono,
                vehiculo_id=vehiculo_id,
                tipo=TipoIntencion.compra,
                respondido=True,
            )
            session.add(nueva)

    def handle(
        self,
        payload: AgentChatRequest,
        session: Session,
        historial: Optional[List[ChatTurn]] = None,
    ) -> AgentChatResponse:
        """Procesa una consulta de catálogo en tiempo real con stock directo de Postgres y memoria multi-turno."""
        stock_texto, ids_validos = self.obtener_stock_resumen(session)
        # Liberar la transacción de lectura antes de la llamada HTTP al LLM
        session.commit()

        system_prompt = PROMPT_CATALOGO_TEMPLATE.format(
            datos_venta=DATOS_VENTA_MAXI,
            cliente_nombre=payload.cliente_nombre or "No informado aún",
            stock_actual=stock_texto,
        )

        decision = self.llm.generar_estructurado(
            schema_cls=DecisionCatalogo,
            system_prompt=system_prompt,
            user_message=payload.mensaje,
            historial=historial,
        )

        # Validar que el ID de vehículo devuelto por el LLM pertenezca realmente al stock activo
        vehiculo_id = decision.vehiculo_interes_id
        if vehiculo_id is not None and vehiculo_id not in ids_validos:
            logger.warning(
                "El LLM devolvió un vehiculo_interes_id (%s) fuera del stock activo; se descarta.",
                vehiculo_id,
            )
            vehiculo_id = None

        # Si el cliente mostró interés en un vehículo válido, dejarlo asentado en `interacciones`
        if vehiculo_id is not None:
            self._registrar_interes_vehiculo(
                session=session,
                cliente_telefono=payload.cliente_telefono,
                cliente_nombre=payload.cliente_nombre,
                vehiculo_id=vehiculo_id,
            )

        # Reglas de negocio determinísticas en Python:
        accion = "consulta_stock"
        camino_salida = Camino.catalogo.value

        if decision.derivar_a_maxi:
            accion = "derivado_humano"
        elif decision.quiere_coordinar_visita:
            accion = "intencion_visita"
            # Si el cliente ya expresó intención de verlo, dejamos la sesión lista en 'agendar_cita'
            camino_salida = Camino.agendar_cita.value

        return AgentChatResponse(
            respuesta_texto=decision.respuesta_whatsapp,
            camino=camino_salida,
            accion_ejecutada=accion,
            derivar_a_humano=decision.derivar_a_maxi,
            metadata={
                "vehiculo_interes_id": vehiculo_id,
                "quiere_coordinar_visita": decision.quiere_coordinar_visita,
                "session_id": payload.session_id,
                "telefono": payload.cliente_telefono,
            },
        )
