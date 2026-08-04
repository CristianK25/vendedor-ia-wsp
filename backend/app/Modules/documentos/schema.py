from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.Modules.documentos.model import TipoDocumento
from app.Modules.vehiculos.model import EtapaVehiculo

class DocumentoVehiculoResponse(BaseModel):
    id: int
    vehiculo_id: int
    etapa: EtapaVehiculo
    tipo_documento: TipoDocumento
    ruta_archivo: str
    nombre_original: str
    fecha_subida: datetime

    class Config:
        from_attributes = True
