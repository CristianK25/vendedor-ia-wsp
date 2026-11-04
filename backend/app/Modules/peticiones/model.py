from typing import Optional
from datetime import datetime
import uuid
from sqlmodel import Field, SQLModel

class Peticion(SQLModel, table=True):
    __tablename__ = "peticiones"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    cliente_nombre: str
    cliente_telefono: str
    vehiculo_modelo: Optional[str] = Field(default=None)
    fecha_propuesta: datetime
    
    # 'cliente' o 'admin' (quién hizo esta propuesta)
    origen: str = Field(default="cliente")
    
    # 'pendiente_admin', 'pendiente_cliente', 'completada', 'cancelada'
    estado: str = Field(default="pendiente_admin")
    
    peticion_padre_id: Optional[int] = Field(default=None)
    token_confirmacion: Optional[str] = Field(default_factory=lambda: uuid.uuid4().hex)

    # Estado de envío por WhatsApp (notificación de propuesta de Maxi / reprogramación)
    whatsapp_enviado: bool = Field(default=False)
    whatsapp_enviado_at: Optional[datetime] = Field(default=None)
    whatsapp_mensaje_id: Optional[str] = Field(default=None)
