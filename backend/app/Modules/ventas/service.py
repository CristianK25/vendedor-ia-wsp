from sqlmodel import Session
from fastapi import HTTPException, status
from app.Modules.ventas.repository import VentaRepository
from app.Modules.ventas.model import Venta
from app.Modules.ventas.schema import VentaCreate

class VentaService:
    def __init__(self, session: Session):
        self.session = session
        self.repository = VentaRepository(session)

    def get_all_ventas(self, skip: int = 0, limit: int = 50, search: str = "", sort_by: str = "", sort_dir: str = "asc"):
        return self.repository.get_all(skip, limit, search, sort_by, sort_dir)

    def get_venta(self, venta_id: int):
        venta = self.repository.get_by_id(venta_id)
        if not venta:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")
        return venta

    def get_venta_por_vehiculo(self, vehiculo_id: int):
        venta = self.repository.get_by_vehiculo_id(vehiculo_id)
        if not venta:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta asociada al vehículo no encontrada")
        
        from app.Modules.clientes.repository import ClienteRepository
        cliente_repo = ClienteRepository(self.session)
        cliente = cliente_repo.get_by_telefono(venta.cliente_telefono)
        
        venta_dict = venta.model_dump()
        if cliente:
            venta_dict["cliente_nombre"] = cliente.nombre
            
        return venta_dict

    def create_venta(self, venta_data: VentaCreate):
        from app.Modules.vehiculos.repository import VehiculoRepository
        from app.Modules.vehiculos.model import EstadoVehiculo
        vehiculo_repo = VehiculoRepository(self.session)
        vehiculo = vehiculo_repo.get_by_id(venta_data.vehiculo_id)
        if not vehiculo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehiculo no encontrado")
        if vehiculo.estado != EstadoVehiculo.disponible:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El vehiculo no está disponible para venta")
            
        from app.Modules.clientes.repository import ClienteRepository
        cliente_repo = ClienteRepository(self.session)
        cliente = cliente_repo.get_by_telefono(venta_data.cliente_telefono)
        if not cliente:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")

        vehiculo.estado = EstadoVehiculo.vendido
        vehiculo_repo.update(vehiculo)

        venta = Venta(**venta_data.model_dump())
        return self.repository.create(venta)
