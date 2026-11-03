from datetime import datetime
from enum import Enum
from typing import Any, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class Camino(str, Enum):
    catalogo = "catalogo"
    tasacion = "tasacion"
    financiacion = "financiacion"
    negociacion = "negociacion"
    peticion = "peticion"
    agendar_cita = "agendar_cita"
    humano = "humano"
    general = "general"
    fallback = "fallback"


class ChatTurn(BaseModel):
    """DTO desacoplado de la sesión SQLAlchemy para representar un turno de conversación."""
    role: Literal["user", "assistant"]
    content: str
    camino: Optional[str] = None
    created_at: Optional[datetime] = None


class DecisionCatalogo(BaseModel):
    """Esquema de salida estructurada validado contra la respuesta JSON del LLM en el camino Catálogo."""
    respuesta_whatsapp: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Mensaje en español argentino con voseo (2 a 4 líneas), cercano y cordial, que responde con datos del stock y termina con una pregunta o propuesta concreta.",
    )
    vehiculo_interes_id: Optional[int] = Field(
        default=None,
        description="ID numérico del vehículo del stock por el cual el cliente consultó o mostró interés puntual (null si fue una consulta general o el auto no existe en el listado).",
    )
    quiere_coordinar_visita: bool = Field(
        default=False,
        description="True ÚNICAMENTE si el CLIENTE en su mensaje pidió ir a ver el auto, coordinar cita o aceptó explícitamente visitarnos ('sí quiero verlo', 'mañana puedo'). Debe ser False si el cliente solo preguntó precio/stock aunque vos en tu respuesta le ofrezcas coordinar visita.",
    )
    derivar_a_maxi: bool = Field(
        default=False,
        description="True si el cliente quiere cerrar/señar, negocia precio, pide financiación concreta, entrega un usado, tiene un reclamo o pregunta un dato técnico que no figura en la ficha del stock.",
    )


class DecisionPeticion(BaseModel):
    """Esquema de salida estructurada para el camino de agendar cita / petición de visita."""
    respuesta_whatsapp: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Mensaje corto en español argentino con voseo (2 a 4 líneas). Si falta día u hora, pregunta qué día y horario le queda cómodo. Si ya dio día y hora, confirma que se registró la solicitud de visita y que Maxi le confirmará el horario y pasará la ubicación.",
    )
    vehiculo_modelo: Optional[str] = Field(
        default=None,
        description="Marca, modelo y año del vehículo que el cliente quiere ver (deducido del historial o del mensaje actual, ej: 'Peugeot Partner 2014'). Null si aún no se sabe.",
    )
    cliente_nombre_detectado: Optional[str] = Field(
        default=None,
        description="Nombre del cliente si lo mencionó en el mensaje o historial. Null si no lo dijo.",
    )
    fecha_hora_iso: Optional[str] = Field(
        default=None,
        description="Fecha y hora propuesta por el cliente en formato ISO 'YYYY-MM-DDTHH:MM:00' (ej: '2026-11-04T17:00:00') SOLO si el cliente ya indicó día y hora concretos. Si solo dijo 'sí quiero verlo' o dijo el día sin hora, debe ser null.",
    )
    confirmar_peticion: bool = Field(
        default=False,
        description="True ÚNICAMENTE cuando el cliente ya indicó día y hora concretos (fecha_hora_iso no es null) y corresponde guardar la solicitud de cita en la base de datos.",
    )
    derivar_a_maxi: bool = Field(
        default=False,
        description="True solo si el cliente exige hablar con Maxi de inmediato o plantea un reclamo.",
    )


class AgentChatRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="ignore")

    session_id: str = Field(..., min_length=1, max_length=64)
    cliente_telefono: str = Field(..., min_length=1, max_length=32)
    cliente_nombre: Optional[str] = Field(default=None, max_length=100)
    camino: str = Field(
        default=Camino.fallback.value,
        max_length=32,
        description="Camino detectado por Laya: catalogo, tasacion, financiacion, peticion, negociacion, humano, fallback.",
    )
    mensaje: str = Field(..., min_length=1, max_length=2000)

    @field_validator("session_id", "cliente_telefono", "cliente_nombre", "camino", "mensaje", mode="before")
    @classmethod
    def sanitize_n8n_expression_prefix(cls, value: Any) -> Any:
        if isinstance(value, str):
            cleaned = value.lstrip("=").strip()
            return cleaned
        return value

    @field_validator("camino", mode="after")
    @classmethod
    def normalize_camino(cls, value: str) -> str:
        return value.lower().strip() or Camino.fallback.value


class AgentChatResponse(BaseModel):
    respuesta_texto: str
    camino: str
    accion_ejecutada: Optional[str] = None
    derivar_a_humano: bool = False
    metadata: Optional[dict[str, Any]] = None
