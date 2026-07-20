import enum
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship

class EstadoVehiculo(str, enum.Enum):
    disponible = "disponible"
    vendido = "vendido"
    reventa = "reventa"
    reservado = "reservado"

class Vehiculo(SQLModel, table=True):
    __tablename__ = "vehiculos"
    id: Optional[int] = Field(default=None, primary_key=True)
    modelo: str
    precio: float
    kilometraje: int
    detalle_interior: Optional[str] = None
    detalle_exterior: Optional[str] = None
    informacion_extra: Optional[str] = None
    anio: int
    transmision: str
    patente: str = Field(unique=True)
    estado: EstadoVehiculo = Field(default=EstadoVehiculo.disponible)
    activo: bool = Field(default=True)
    
    imagenes: List["Imagen"] = Relationship(back_populates="vehiculo", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
