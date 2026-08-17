import enum
from datetime import date, datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from app.Modules.vehiculos.model import Vehiculo

class CategoriaGasto(str, enum.Enum):
    mecanica = "mecanica"
    detailing_preparacion = "detailing_preparacion"
    repuestos = "repuestos"
    flete = "flete"
    patentes_tramites = "patentes_tramites"
    otros = "otros"

class GastoVehiculo(SQLModel, table=True):
    __tablename__ = "gastos_vehiculo"

    id: Optional[int] = Field(default=None, primary_key=True)
    vehiculo_id: int = Field(foreign_key="vehiculos.id", ondelete="CASCADE")
    fecha: date = Field(default_factory=date.today)
    categoria: CategoriaGasto
    monto: float
    proveedor: str
    factura_a: bool = Field(default=False)
    comprobante_url: Optional[str] = Field(default=None, max_length=500)
    fecha_hora_carga: datetime = Field(default_factory=datetime.utcnow)

    # Relaciones
    vehiculo: Optional["Vehiculo"] = Relationship(back_populates="gastos")
