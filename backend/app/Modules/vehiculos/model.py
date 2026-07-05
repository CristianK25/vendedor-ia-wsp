from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship

class Vehiculo(SQLModel, table=True):
    __tablename__ = "vehiculos"
    id: Optional[int] = Field(default=None, primary_key=True)
    modelo: str
    precio: float
    kilometraje: int
    detalle_interior: Optional[str] = None
    detalle_exterior: Optional[str] = None
    informacion_extra: Optional[str] = None
    estado: str = Field(default="disponible")
    
    imagenes: List["Imagen"] = Relationship(back_populates="vehiculo", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
