from typing import Optional
from sqlmodel import Field, SQLModel

class Vehiculo(SQLModel, table=True):
    __tablename__ = "vehiculos"
    id: Optional[int] = Field(default=None, primary_key=True)
    modelo: str
    precio: float
    kilometraje: int
    imagenes: Optional[str] = None
    detalle_interior: Optional[str] = None
    detalle_exterior: Optional[str] = None
    informacion_extra: Optional[str] = None
    estado: str = Field(default="disponible")
