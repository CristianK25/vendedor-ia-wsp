from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List
from app.Modules.gastos.model import CategoriaGasto

class GastoCreate(BaseModel):
    fecha: date
    categoria: CategoriaGasto
    monto: float
    proveedor: str
    factura_a: bool = False

class GastoUpdate(BaseModel):
    fecha: Optional[date] = None
    categoria: Optional[CategoriaGasto] = None
    monto: Optional[float] = None
    proveedor: Optional[str] = None
    factura_a: Optional[bool] = None

class GastoResponse(BaseModel):
    id: int
    vehiculo_id: int
    fecha: date
    categoria: CategoriaGasto
    monto: float
    proveedor: str
    factura_a: bool
    comprobante_url: Optional[str] = None
    fecha_hora_carga: datetime

    class Config:
        from_attributes = True

class ResumenGastosVehiculo(BaseModel):
    total_gastos: float
    total_factura_a: float
    iva_recuperable: float
    costo_total_unidad: Optional[float] = None
    gastos: List[GastoResponse] = []
