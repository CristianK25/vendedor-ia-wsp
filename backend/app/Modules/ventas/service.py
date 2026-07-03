from sqlmodel import Session
from fastapi import HTTPException, status
from app.Modules.ventas.repository import VentaRepository
from app.Modules.ventas.model import Venta
from app.Modules.ventas.schema import VentaCreate

class VentaService:
    def __init__(self, session: Session):
        self.repository = VentaRepository(session)

    def get_all_ventas(self):
        return self.repository.get_all()

    def get_venta(self, venta_id: int):
        venta = self.repository.get_by_id(venta_id)
        if not venta:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")
        return venta

    def create_venta(self, venta_data: VentaCreate):
        # NOTA: Aqui se deberia validar que el vehiculo existe y esta disponible
        # y que el cliente existe. Además, cambiar el estado del vehiculo a 'vendido'.
        venta = Venta(**venta_data.model_dump())
        return self.repository.create(venta)
