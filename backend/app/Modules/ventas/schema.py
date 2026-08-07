from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class VentaCreate(BaseModel):
    vehiculo_id: int
    cliente_telefono: str
    precio_final: float
    metodo_pago: Optional[str] = "Efectivo"
    estado_vehiculo: Optional[str] = "vendido"
    notas: Optional[str] = None
    comision_retenida: Optional[float] = None
    monto_girado_dueno: Optional[float] = None
    monto_girado_entregado: Optional[bool] = False

class VentaResponse(BaseModel):
    id: int
    vehiculo_id: int
    vehiculo_modelo: Optional[str] = None
    tipo_venta: Optional[str] = None
    cliente_telefono: str
    cliente_nombre: Optional[str] = None
    fecha: datetime
    precio_final: float
    metodo_pago: str
    notas: Optional[str]
    comision_retenida: Optional[float] = None
    monto_girado_dueno: Optional[float] = None
    monto_girado_entregado: Optional[bool] = None

class PaginatedVentasResponse(BaseModel):
    items: List[VentaResponse]
    total: int
    page: int
    size: int
    total_pages: int
