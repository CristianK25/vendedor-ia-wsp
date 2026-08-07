from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel

class Venta(SQLModel, table=True):
    __tablename__ = "ventas"
    id: Optional[int] = Field(default=None, primary_key=True)
    vehiculo_id: int = Field(foreign_key="vehiculos.id")
    cliente_telefono: str = Field(foreign_key="clientes.telefono")
    fecha: Optional[datetime] = Field(default_factory=datetime.utcnow)
    precio_final: float
    metodo_pago: str = Field(default="Efectivo")
    tipo_venta: str = Field(default="vendido")
    notas: Optional[str] = None
    activo: bool = Field(default=True)
    
    # Consignment financial fields (optional for backward compatibility)
    comision_retenida: Optional[float] = Field(default=None, nullable=True)
    monto_girado_dueno: Optional[float] = Field(default=None, nullable=True)
    monto_girado_entregado: Optional[bool] = Field(default=False, nullable=True)
