import enum
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship

class OrigenCompra(str, enum.Enum):
    particular = "particular"
    ri_factura_a = "ri_factura_a"

class EstadoVehiculo(str, enum.Enum):
    disponible = "disponible"
    vendido = "vendido"
    reventa = "reventa"
    reservado = "reservado"

class EtapaVehiculo(str, enum.Enum):
    pre_compra = "pre_compra"
    comprado = "comprado"
    en_stock = "en_stock"
    vendido = "vendido"

class Vehiculo(SQLModel, table=True):
    __tablename__ = "vehiculos"
    id: Optional[int] = Field(default=None, primary_key=True)
    modelo: str
    precio_venta: float
    precio_compra: Optional[float] = Field(default=None)
    origen_compra: Optional[OrigenCompra] = Field(default=None)
    kilometraje: int
    detalle_interior: Optional[str] = None
    detalle_exterior: Optional[str] = None
    informacion_extra: Optional[str] = None
    anio: int
    transmision: str
    patente: str = Field(unique=True)
    estado: EstadoVehiculo = Field(default=EstadoVehiculo.disponible)
    activo: bool = Field(default=True)
    traccion: Optional[str] = Field(default=None)
    tipo: Optional[str] = Field(default=None)
    condicion: Optional[str] = Field(default=None)
    etapa: EtapaVehiculo = Field(default=EtapaVehiculo.pre_compra)
    
    imagenes: List["Imagen"] = Relationship(back_populates="vehiculo", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    documentos: List["DocumentoVehiculo"] = Relationship(back_populates="vehiculo", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
