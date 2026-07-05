from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from app.Modules.vehiculos.model import Vehiculo

class Imagen(SQLModel, table=True):
    __tablename__ = "vehiculo_imagenes"
    id: Optional[int] = Field(default=None, primary_key=True)
    vehiculo_id: int = Field(foreign_key="vehiculos.id", ondelete="CASCADE")
    ruta: str
    es_principal: bool = Field(default=False)
    orden: int = Field(default=0)
    
    vehiculo: Optional["Vehiculo"] = Relationship(back_populates="imagenes")
