import logging
from typing import List, Optional, Set, Tuple
from sqlmodel import Session, select

from app.Modules.vehiculos.model import EstadoVehiculo, Vehiculo
from app.Modules.agent.handlers.base import BaseHandler
from app.Modules.agent.llm import LLMClient, llm_client
from app.Modules.agent.prompts import PROMPT_CATALOGO_TEMPLATE
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
        Consulta el stock disponible y activo en PostgreSQL de forma determinística
        y retorna tanto el texto para el prompt como el conjunto de IDs válidos en stock.
        """
        statement = (
            select(Vehiculo)
            .where(
                Vehiculo.estado == EstadoVehiculo.disponible,
                Vehiculo.activo.is_(True),
            )
            .order_by(Vehiculo.marca.asc(), Vehiculo.modelo.asc(), Vehiculo.anio.desc())
        )
        vehiculos = session.exec(statement).all()

        if not vehiculos:
            return "Actualmente no hay vehículos disponibles en stock.", set()

        lineas: list[str] = []
        ids_validos: set[int] = set()

        for v in vehiculos:
            if v.id is not None:
                ids_validos.add(v.id)

            moneda = v.moneda_venta.value if v.moneda_venta else "PESOS"
            if moneda == "USD":
                precio_str = f"USD {v.precio_venta:,.0f}"
            else:
                precio_str = f"${v.precio_venta:,.0f}".replace(",", ".")

            tipo_desc = f" ({v.tipo})" if v.tipo else ""
            lineas.append(
                f"- [ID: {v.id}] {v.marca} {v.modelo} {v.anio} | {v.kilometraje:,} km | {precio_str} | Transmisión: {v.transmision}{tipo_desc}"
            )

        return "\n".join(lineas), ids_validos

    def handle(
        self,
        payload: AgentChatRequest,
        session: Session,
        historial: Optional[List[ChatTurn]] = None,
    ) -> AgentChatResponse:
        """Procesa una consulta de catálogo en tiempo real con stock directo de Postgres y memoria multi-turno."""
        stock_texto, ids_validos = self.obtener_stock_resumen(session)
        # Cerramos la transacción de solo lectura antes de la llamada de red al LLM
        # para no retener la conexión en estado 'idle in transaction'.
        session.commit()

        system_prompt = PROMPT_CATALOGO_TEMPLATE.format(stock_actual=stock_texto)

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
                "El LLM devolvió un vehiculo_interes_id (%s) fuera del stock disponible; se descarta.",
                vehiculo_id,
            )
            vehiculo_id = None

        # Reglas de negocio determinísticas en Python:
        accion = "consulta_stock"
        if decision.quiere_coordinar_visita:
            accion = "intencion_visita"
        elif decision.derivar_a_maxi:
            accion = "derivado_humano"

        return AgentChatResponse(
            respuesta_texto=decision.respuesta_whatsapp,
            camino=Camino.catalogo.value,
            accion_ejecutada=accion,
            derivar_a_humano=decision.derivar_a_maxi,
            metadata={
                "vehiculo_interes_id": vehiculo_id,
                "quiere_coordinar_visita": decision.quiere_coordinar_visita,
                "session_id": payload.session_id,
                "telefono": payload.cliente_telefono,
            },
        )
