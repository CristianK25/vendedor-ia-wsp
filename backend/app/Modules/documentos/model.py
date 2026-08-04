from typing import Optional, TYPE_CHECKING
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship
import enum
from app.Modules.vehiculos.model import EtapaVehiculo

if TYPE_CHECKING:
    from app.Modules.vehiculos.model import Vehiculo

class TipoDocumento(str, enum.Enum):
    # Pre-compra
    informe_dominio = "informe_dominio"
    deuda_patentes = "deuda_patentes"
    # Comprado
    boleto_compra = "boleto_compra"
    dni_vendedor = "dni_vendedor"
    cedula_vehiculo = "cedula_vehiculo"
    formulario_08 = "formulario_08"
    # En Stock
    contrato_consignacion = "contrato_consignacion"
    # Vendido
    boleto_venta = "boleto_venta"
    verificacion_policial = "verificacion_policial"
    dni_comprador = "dni_comprador"
    formulario_08_12 = "formulario_08_12"
    factura_venta = "factura_venta"
    circuito_plata = "circuito_plata"

class DocumentoVehiculo(SQLModel, table=True):
    __tablename__ = "documentos_vehiculo"
    id: Optional[int] = Field(default=None, primary_key=True)
    vehiculo_id: int = Field(foreign_key="vehiculos.id", ondelete="CASCADE")
    etapa: EtapaVehiculo
    tipo_documento: TipoDocumento
    ruta_archivo: str
    nombre_original: str
    fecha_subida: datetime = Field(default_factory=datetime.utcnow)
    
    vehiculo: Optional["Vehiculo"] = Relationship(back_populates="documentos")
