from datetime import datetime
from enum import Enum
from typing import Any, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.Core.phone import sanitizar_telefono, sanitizar_nombre


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


class DecisionTasacion(BaseModel):
    """Esquema de salida estructurada para el camino de Tasación / Permuta de usados."""
    respuesta_whatsapp: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Mensaje corto en español argentino con voseo (2 a 4 líneas). Si faltan datos del usado, pide marca, modelo, año, km y fotos. Si ya dio modelo/año y km, confirma que anotó los datos y que Maxi le escribirá personalmente.",
    )
    vehiculo_modelo_tasacion: Optional[str] = Field(
        default=None,
        description="Marca, modelo y año del vehículo usado que el cliente ofrece entregar (ej: 'VW Gol Trend 2017'). Null si aún no lo mencionó.",
    )
    kilometraje_tasacion: Optional[str] = Field(
        default=None,
        description="Kilometraje aproximado del auto usado del cliente si lo mencionó (ej: '95.000 km'). Null si aún no lo dijo.",
    )
    precio_pretendido: Optional[float] = Field(
        default=None,
        description="Valor numérico que el cliente pretende por su auto usado, solo si lo mencionó explícitamente. Null si no dijo precio.",
    )
    detalles_tasacion: Optional[str] = Field(
        default=None,
        description="Resumen de los datos del usado informados por el cliente: kilometraje, versión, estado general y por qué vehículo de nuestro stock le interesa permutar.",
    )
    vehiculo_interes_id: Optional[int] = Field(
        default=None,
        description="ID numérico del vehículo de nuestro stock por el cual el cliente quiere permutar su usado, si lo mencionó. Null si no especificó ninguno.",
    )
    cliente_nombre_detectado: Optional[str] = Field(
        default=None,
        description="Nombre del cliente si lo mencionó en el mensaje o historial. Null si no lo dijo.",
    )
    datos_usado_completos: bool = Field(
        default=False,
        description="True ÚNICAMENTE cuando el cliente ya informó al menos qué auto/modelo/año tiene y su kilometraje aproximado.",
    )
    derivar_a_maxi: bool = Field(
        default=False,
        description="True cuando datos_usado_completos es True (para que Maxi evalúe la permuta personalmente) o si el cliente pide hablar con Maxi.",
    )


class DecisionFinanciacion(BaseModel):
    """Esquema de salida estructurada para el camino de Financiación y formas de pago."""
    respuesta_whatsapp: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Mensaje corto en español argentino con voseo (2 a 4 líneas). Da información general de medios de pago/financiación sin prometer cuotas exactas. Si pide financiación concreta, avisa que Maxi le escribirá personalmente.",
    )
    vehiculo_interes_id: Optional[int] = Field(
        default=None,
        description="ID numérico del vehículo de nuestro stock sobre el que consulta financiación, si lo mencionó. Null si es consulta general.",
    )
    monto_entrega_ofrecido: Optional[float] = Field(
        default=None,
        description="Monto numérico de anticipo/entrega que el cliente mencionó tener disponible, si lo dijo. Null si no mencionó monto.",
    )
    cliente_nombre_detectado: Optional[str] = Field(
        default=None,
        description="Nombre del cliente si lo mencionó en el mensaje o historial. Null si no lo dijo.",
    )
    derivar_a_maxi: bool = Field(
        default=False,
        description="True si el cliente pide financiación concreta sobre un auto, cálculo de cuotas o propone un anticipo para armar plan. False solo si fue una pregunta general ('¿aceptan dólares?', '¿tienen financiación?').",
    )


class DecisionNegociacion(BaseModel):
    """Esquema de salida estructurada para el camino de Negociación / Ofertas de contado."""
    respuesta_whatsapp: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Mensaje corto en español argentino con voseo (2 a 4 líneas). Indica amablemente que el precio final se charla en persona viendo el auto ('El precio final lo charlamos cuando lo veas') y que Maxi se comunicará personalmente.",
    )
    vehiculo_interes_id: Optional[int] = Field(
        default=None,
        description="ID numérico del vehículo de nuestro stock por el cual el cliente está ofertando o pidiendo descuento. Null si no se sabe.",
    )
    oferta_cliente: Optional[float] = Field(
        default=None,
        description="Monto numérico ofertado por el cliente, si hizo una oferta concreta en números. Null si solo pidió descuento sin dar cifra.",
    )
    cliente_nombre_detectado: Optional[str] = Field(
        default=None,
        description="Nombre del cliente si lo mencionó en el mensaje o historial. Null si no lo dijo.",
    )
    derivar_a_maxi: bool = Field(
        default=True,
        description="True siempre que el cliente pide descuento, hace una oferta o quiere cerrar precio.",
    )


class DecisionGeneral(BaseModel):
    """Esquema de salida estructurada para el camino General / Saludo inicial."""
    respuesta_whatsapp: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Mensaje corto en español argentino con voseo (2 a 4 líneas). Si es un saludo, da la bienvenida y pregunta qué auto o presupuesto busca. Si pregunta horarios/zona/transferencia, responde con los DATOS DE VENTA y pregunta qué auto le interesa.",
    )
    cliente_nombre_detectado: Optional[str] = Field(
        default=None,
        description="Nombre del cliente si lo mencionó en el mensaje o historial. Null si no lo dijo.",
    )
    derivar_a_maxi: bool = Field(
        default=False,
        description="True solo si el cliente tiene un reclamo o pregunta algo que no figura en los DATOS DE VENTA ni en el STOCK ACTUAL.",
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

    @field_validator("cliente_telefono", mode="after")
    @classmethod
    def normalize_telefono(cls, value: str) -> str:
        return sanitizar_telefono(value)

    @field_validator("session_id", mode="after")
    @classmethod
    def normalize_session_id(cls, value: str) -> str:
        # Si session_id parece un teléfono, normalizarlo también para consistencia
        try:
            return sanitizar_telefono(value)
        except Exception:
            return value.strip()

    @field_validator("cliente_nombre", mode="after")
    @classmethod
    def clean_cliente_nombre(cls, value: Optional[str]) -> Optional[str]:
        return sanitizar_nombre(value)

    @field_validator("camino", mode="after")
    @classmethod
    def normalize_camino(cls, value: str) -> str:
        return value.lower().strip() or Camino.fallback.value


class AgentChatResponse(BaseModel):
    respuesta_texto: str
    camino: str
    accion_ejecutada: Optional[str] = None
    derivar_a_humano: bool = False
    enviar_mensaje_whatsapp: bool = True
    metadata: Optional[dict[str, Any]] = None
