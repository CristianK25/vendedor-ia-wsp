from typing import Optional
from datetime import datetime
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
