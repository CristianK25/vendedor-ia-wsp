from sqlmodel import Session
from fastapi import HTTPException, status, UploadFile
from typing import List
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
        # 1. Crear el vehículo en BD
        vehiculo = Vehiculo(**vehiculo_data.model_dump())
        vehiculo_creado = self.repository.create(vehiculo)
        
        # 2. Guardar las imágenes usando el servicio de Imágenes
        if imagenes:
            img_service = ImagenesService(self.session)
            try:
                await img_service.procesar_y_guardar_imagenes(vehiculo_creado.id, imagenes)
                self.session.commit()
                self.session.refresh(vehiculo_creado)
            except Exception as e:
                # Si fallan las imágenes, borramos el vehículo para evitar registros incompletos (compensación manual)
                self.repository.delete(vehiculo_creado)
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al procesar las imágenes: {str(e)}")

        return vehiculo_creado

    def update_vehiculo(self, vehiculo_id: int, vehiculo_data: VehiculoUpdate):
        vehiculo = self.get_vehiculo(vehiculo_id)
        update_data = vehiculo_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(vehiculo, key, value)
        return self.repository.update(vehiculo)

    def delete_vehiculo(self, vehiculo_id: int):
        # Como hay cascade='all, delete-orphan', borrar el vehículo borrará las imágenes en BD.
        # PERO necesitamos borrar los archivos físicos.
        vehiculo = self.get_vehiculo(vehiculo_id)
        imagenes = vehiculo.imagenes
        
        # 1. Borrar BD
        self.repository.delete(vehiculo)
        
        # 2. Borrar físico
        if imagenes:
            img_service = ImagenesService(self.session)
            img_service.limpiar_archivos(imagenes)
            
        return {"message": "Vehiculo eliminado exitosamente"}
