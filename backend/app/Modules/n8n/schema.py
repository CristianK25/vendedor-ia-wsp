from pydantic import BaseModel, field_validator
from typing import Optional, Any
from datetime import datetime
from app.Core.phone import sanitizar_telefono, sanitizar_nombre

class N8NCitaCreate(BaseModel):
    vehiculo_id: Optional[int] = None
    cliente_telefono: str
    fecha: datetime
    notas: Optional[str] = None

    @field_validator("cliente_telefono", mode="after")
    @classmethod
    def normalize_tel(cls, v: str) -> str:
        return sanitizar_telefono(v)

class PeticionCreateN8N(BaseModel):
    cliente_nombre: str
    cliente_telefono: str
    vehiculo_modelo: Optional[str] = None
    fecha_propuesta: datetime

    @field_validator("cliente_telefono", mode="after")
    @classmethod
    def normalize_tel(cls, v: str) -> str:
        return sanitizar_telefono(v)

    @field_validator("cliente_nombre", mode="after")
    @classmethod
    def clean_nombre(cls, v: str) -> str:
        return sanitizar_nombre(v) or v

class N8NCitaCancel(BaseModel):
    cita_id: int

class N8NClienteCheck(BaseModel):
    telefono: str
    nombre: Optional[str] = None
    ultima_interaccion_cliente: Optional[datetime] = None

    @field_validator("telefono", mode="after")
    @classmethod
    def normalize_tel(cls, v: str) -> str:
        return sanitizar_telefono(v)

    @field_validator("nombre", mode="after")
    @classmethod
    def clean_nombre(cls, v: Optional[str]) -> Optional[str]:
        return sanitizar_nombre(v)

class N8NResenaCreate(BaseModel):
    cliente_telefono: str
    comentario: str

    @field_validator("cliente_telefono", mode="after")
    @classmethod
    def normalize_tel(cls, v: str) -> str:
        return sanitizar_telefono(v)

class N8NWhatsAppBufferRequest(BaseModel):
    cliente_telefono: str
    texto: str
    nombre: Optional[str] = None
    wait_seconds: Optional[int] = 4

    @field_validator("cliente_telefono", mode="after")
    @classmethod
    def normalize_tel(cls, v: str) -> str:
        return sanitizar_telefono(v)

    @field_validator("nombre", mode="after")
    @classmethod
    def clean_nombre(cls, v: Optional[str]) -> Optional[str]:
        return sanitizar_nombre(v)

class N8NWhatsAppBufferResponse(BaseModel):
    procesar: bool
    cliente_telefono: str
    cliente_nombre: Optional[str] = None
    mensaje_completo: Optional[str] = None
    total_mensajes: Optional[int] = 0
    motivo: Optional[str] = None


class N8NWhatsAppEnviado(BaseModel):
    mensaje_id: Optional[str] = None
    estado: str = "enviado"
    accion: Optional[str] = None

