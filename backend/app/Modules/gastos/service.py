import os
import uuid
import shutil
from datetime import date
from typing import Optional, List
from fastapi import UploadFile, HTTPException, status
from sqlmodel import Session
from app.Modules.gastos.repository import GastoRepository
from app.Modules.gastos.model import GastoVehiculo
from app.Modules.gastos.schema import GastoCreate, GastoUpdate, GastoResponse, ResumenGastosVehiculo
from app.Modules.vehiculos.repository import VehiculoRepository

UPLOAD_DIR = "gastos"

class GastoService:
    def __init__(self, session: Session):
        self.session = session
        self.repository = GastoRepository(session)
        self.vehiculo_repository = VehiculoRepository(session)

        # Asegurar que el directorio de subidas exista
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR)

    def get_resumen_gastos(self, vehiculo_id: int) -> ResumenGastosVehiculo:
        vehiculo = self.vehiculo_repository.get_by_id(vehiculo_id)
        if not vehiculo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehículo no encontrado")

        gastos = self.repository.get_by_vehiculo_id(vehiculo_id)
        total_gastos, total_factura_a = self.repository.get_totales_vehiculo(vehiculo_id)

        costo_total = None
        if vehiculo.precio_compra is not None:
            # Solo sumamos si la moneda de compra es PESOS (los gastos son en pesos)
            if vehiculo.moneda_compra == "PESOS" or vehiculo.moneda_compra is None:
                costo_total = vehiculo.precio_compra + total_gastos

        gastos_response = []
        for g in gastos:
            gastos_response.append(
                GastoResponse(
                    id=g.id,
                    vehiculo_id=g.vehiculo_id,
                    fecha=g.fecha,
                    categoria=g.categoria,
                    monto=g.monto,
                    proveedor=g.proveedor,
                    factura_a=g.factura_a,
                    comprobante_url=g.comprobante_url,
                    fecha_hora_carga=g.fecha_hora_carga
                )
            )

        iva_recuperable = (total_factura_a / 1.21) * 0.21

        return ResumenGastosVehiculo(
            total_gastos=total_gastos,
            total_factura_a=total_factura_a,
            iva_recuperable=iva_recuperable,
            costo_total_unidad=costo_total,
            gastos=gastos_response
        )

    async def crear_gasto(
        self,
        vehiculo_id: int,
        gasto_data: GastoCreate,
        archivo: Optional[UploadFile] = None
    ) -> GastoVehiculo:
        vehiculo = self.vehiculo_repository.get_by_id(vehiculo_id)
        if not vehiculo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehículo no encontrado")

        comprobante_url = None
        if archivo and archivo.filename:
            comprobante_url = await self._guardar_archivo(vehiculo_id, archivo)

        gasto = GastoVehiculo(
            vehiculo_id=vehiculo_id,
            fecha=gasto_data.fecha,
            categoria=gasto_data.categoria,
            monto=gasto_data.monto,
            proveedor=gasto_data.proveedor,
            factura_a=gasto_data.factura_a,
            comprobante_url=comprobante_url
        )

        return self.repository.create(gasto)

    async def editar_gasto(
        self,
        gasto_id: int,
        gasto_data: GastoUpdate,
        archivo: Optional[UploadFile] = None
    ) -> GastoVehiculo:
        gasto = self.repository.get_by_id(gasto_id)
        if not gasto:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gasto no encontrado")

        # Si se sube un nuevo archivo, reemplazamos el anterior
        if archivo and archivo.filename:
            if gasto.comprobante_url:
                self._eliminar_archivo_fisico(gasto.comprobante_url)
            gasto.comprobante_url = await self._guardar_archivo(gasto.vehiculo_id, archivo)

        update_data = gasto_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(gasto, key, value)

        return self.repository.update(gasto)

    def eliminar_gasto(self, gasto_id: int) -> None:
        gasto = self.repository.get_by_id(gasto_id)
        if not gasto:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Gasto no encontrado")

        if gasto.comprobante_url:
            self._eliminar_archivo_fisico(gasto.comprobante_url)

        self.repository.delete(gasto)

    async def _guardar_archivo(self, vehiculo_id: int, file: UploadFile) -> str:
        extension = os.path.splitext(file.filename)[1].lower()
        if extension not in [".pdf", ".jpg", ".jpeg", ".png"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se admiten comprobantes en formato PDF o imagen (JPG, PNG)"
            )

        uuid_corto = uuid.uuid4().hex[:6]
        filename = f"gasto_{vehiculo_id}_{uuid_corto}{extension}"
        filepath = os.path.join(UPLOAD_DIR, filename)

        try:
            with open(filepath, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al guardar el comprobante en disco: {str(e)}"
            )

        return f"/gastos/{filename}"

    def _eliminar_archivo_fisico(self, url_archivo: str) -> None:
        # url_archivo es de la forma "/gastos/filename.extension"
        filename = os.path.basename(url_archivo)
        filepath = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception as e:
                print(f"Error al eliminar archivo físico {filepath}: {str(e)}")
