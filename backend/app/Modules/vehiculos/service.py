from sqlmodel import Session
from fastapi import HTTPException, status, UploadFile
from typing import List, Optional
from app.Modules.vehiculos.repository import VehiculoRepository
from app.Modules.vehiculos.model import Vehiculo
from app.Modules.vehiculos.schema import VehiculoCreate, VehiculoUpdate
from app.Modules.imagenes.service import ImagenesService

class VehiculoService:
    def __init__(self, session: Session):
        self.session = session
        self.repository = VehiculoRepository(session)

    def get_all_vehiculos(
        self, 
        skip: int = 0, 
        limit: int = 50, 
        search: str = "", 
        estado: str = "", 
        precio_min: Optional[float] = None,
        precio_max: Optional[float] = None,
        km_min: Optional[int] = None,
        km_max: Optional[int] = None,
        anio_min: Optional[int] = None,
        anio_max: Optional[int] = None,
        transmision: str = "",
        sort_by: str = "", 
        sort_dir: str = "asc"
    ):
        return self.repository.get_all(
            skip, limit, search, estado, 
            precio_min, precio_max, km_min, km_max, anio_min, anio_max, transmision,
            sort_by, sort_dir
        )
    
    def get_stats(self):
        return self.repository.get_stats()
    
    def get_disponibles(self):
        return self.repository.get_disponibles()

    def get_vehiculo(self, vehiculo_id: int):
        vehiculo = self.repository.get_by_id(vehiculo_id)
        if not vehiculo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehiculo no encontrado")
        return vehiculo

    async def create_vehiculo_con_imagenes(self, vehiculo_data: VehiculoCreate, imagenes: List[UploadFile]):
        from sqlalchemy.exc import IntegrityError
        
        vehiculo = Vehiculo(**vehiculo_data.model_dump())
        try:
            # Añadir y hacer flush (sin commit) para obtener el ID
            self.session.add(vehiculo)
            self.session.flush()
        except IntegrityError as e:
            self.session.rollback()
            if "patente" in str(e).lower():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe un vehículo registrado con esta patente.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Error de integridad de datos al guardar el vehículo.")
        
        if imagenes:
            img_service = ImagenesService(self.session)
            try:
                # procesar_y_guardar_imagenes hace add(imagen) pero no commit
                await img_service.procesar_y_guardar_imagenes(vehiculo.id, imagenes)
            except Exception as e:
                self.session.rollback()
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al procesar las imágenes: {str(e)}")
        
        # Confirmar toda la transacción atómicamente
        self.session.commit()
        self.session.refresh(vehiculo)
        return vehiculo

    def update_vehiculo(self, vehiculo_id: int, vehiculo_data: VehiculoUpdate):
        vehiculo = self.get_vehiculo(vehiculo_id)
        update_data = vehiculo_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(vehiculo, key, value)
        return self.repository.update(vehiculo)

    def delete_vehiculo(self, vehiculo_id: int):
        vehiculo = self.get_vehiculo(vehiculo_id)
        
        try:
            # 1. Soft Delete en DB
            vehiculo.activo = False
            
            # Extraer las rutas y desvincular imágenes
            rutas_imagenes = [img.ruta for img in vehiculo.imagenes] if vehiculo.imagenes else []
            vehiculo.imagenes.clear() # El cascade delete-orphan borrará los registros de imágenes en BD
            
            self.session.add(vehiculo)
            self.session.flush() # Verificamos que Postgres acepte los cambios
            
            # 2. Borrar físico
            if rutas_imagenes:
                img_service = ImagenesService(self.session)
                img_service.limpiar_archivos_por_ruta(rutas_imagenes)
                
            self.session.commit()
            return {"message": "Vehiculo eliminado exitosamente"}
        except Exception as e:
            self.session.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al eliminar el vehículo: {str(e)}")

    def anular_venta_y_eliminar_vehiculo(self, vehiculo_id: int):
        vehiculo = self.get_vehiculo(vehiculo_id)
        
        try:
            # 1. Buscar la Venta y anularla (Soft Delete)
            from app.Modules.ventas.repository import VentaRepository
            venta_repo = VentaRepository(self.session)
            venta = venta_repo.get_by_vehiculo_id(vehiculo_id)
            if venta:
                venta.activo = False
                self.session.add(venta)

            # 2. Soft Delete del Vehículo
            vehiculo.activo = False
            
            # 3. Extraer las rutas y desvincular imágenes
            rutas_imagenes = [img.ruta for img in vehiculo.imagenes] if vehiculo.imagenes else []
            vehiculo.imagenes.clear()
            
            self.session.add(vehiculo)
            self.session.flush()
            
            # 4. Borrar físico
            if rutas_imagenes:
                img_service = ImagenesService(self.session)
                img_service.limpiar_archivos_por_ruta(rutas_imagenes)
                
            self.session.commit()
            return {"message": "Venta anulada y vehiculo eliminado exitosamente"}
        except Exception as e:
            self.session.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error en el borrado conjunto: {str(e)}")
