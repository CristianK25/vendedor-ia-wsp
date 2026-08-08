from pydantic import BaseModel
from typing import Optional, List
from app.Modules.vehiculos.model import EstadoVehiculo, OrigenCompra, EtapaVehiculo, TipoAlta, ComisionTipo

class ImagenResponse(BaseModel):
    id: int
    ruta: str
    es_principal: bool
    orden: int

class VehiculoCreate(BaseModel):
    marca: str
    modelo: str
    precio_venta: float
    precio_compra: Optional[float] = None
    origen_compra: Optional[OrigenCompra] = None
    kilometraje: int
    detalle_interior: Optional[str] = None
    detalle_exterior: Optional[str] = None
    informacion_extra: Optional[str] = None
    anio: int
    transmision: str
    patente: str
    traccion: Optional[str] = None
    tipo: Optional[str] = None
    condicion: Optional[str] = None
    etapa: Optional[EtapaVehiculo] = EtapaVehiculo.pre_compra
    tipo_alta: Optional[TipoAlta] = TipoAlta.compra_directa
    dueno_telefono: Optional[str] = None
    precio_acordado: Optional[float] = None
    comision_tipo: Optional[ComisionTipo] = None
    comision_valor: Optional[float] = None

class VehiculoUpdate(BaseModel):
    marca: Optional[str] = None
    modelo: Optional[str] = None
    precio_venta: Optional[float] = None
    precio_compra: Optional[float] = None
    origen_compra: Optional[OrigenCompra] = None
    kilometraje: Optional[int] = None
    detalle_interior: Optional[str] = None
    detalle_exterior: Optional[str] = None
    informacion_extra: Optional[str] = None
    anio: Optional[int] = None
    transmision: Optional[str] = None
    patente: Optional[str] = None
    estado: Optional[EstadoVehiculo] = None
    traccion: Optional[str] = None
    tipo: Optional[str] = None
    condicion: Optional[str] = None
    etapa: Optional[EtapaVehiculo] = None
    tipo_alta: Optional[TipoAlta] = None
    dueno_telefono: Optional[str] = None
    precio_acordado: Optional[float] = None
    comision_tipo: Optional[ComisionTipo] = None
    comision_valor: Optional[float] = None

class VehiculoResponse(BaseModel):
    id: int
    marca: str = ""
    modelo: str
    precio_venta: float
    precio_compra: Optional[float] = None
    origen_compra: Optional[OrigenCompra] = None
    kilometraje: int
    detalle_interior: Optional[str] = None
    detalle_exterior: Optional[str] = None
    informacion_extra: Optional[str] = None
    anio: int
    transmision: str
    patente: str
    estado: EstadoVehiculo
    imagenes: List[ImagenResponse] = []
    traccion: Optional[str] = None
    tipo: Optional[str] = None
    condicion: Optional[str] = None
    etapa: EtapaVehiculo
    tipo_alta: TipoAlta
    dueno_telefono: Optional[str] = None
    precio_acordado: Optional[float] = None
    comision_tipo: Optional[ComisionTipo] = None
    comision_valor: Optional[float] = None

class PaginatedVehiculosResponse(BaseModel):
    items: List[VehiculoResponse]
    total: int
    page: int
    size: int
    total_pages: int
