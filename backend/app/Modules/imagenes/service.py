import os
import io
import uuid
from typing import List
from fastapi import UploadFile, HTTPException
from sqlmodel import Session
from PIL import Image, ImageOps
from pillow_heif import register_heif_opener
from app.Modules.imagenes.model import Imagen

# Registrar soporte para imágenes HEIC/HEIF (Apple)
register_heif_opener()


UPLOAD_DIR = "fotos"

class ImagenesService:
    def __init__(self, session: Session):
        self.session = session

    async def procesar_y_guardar_imagenes(self, vehiculo_id: int, imagenes: List[UploadFile]) -> List[Imagen]:
        rutas_guardadas = []
        imagenes_creadas = []
        
        try:
            for idx, file in enumerate(imagenes):
                if not file.filename:
                    continue
                
                # Leer bytes
                content = await file.read()
                
                # Abrir con Pillow
                img = Image.open(io.BytesIO(content))
                
                # Auto-orientar según metadata EXIF (para fotos verticales de celulares)
                img = ImageOps.exif_transpose(img)
                
                # Convertir a RGB para evitar problemas al guardar WebP
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                    
                # Redimensionar si es muy grande (máx 1200px en cualquier dimensión)
                max_dim = 1200
                if img.width > max_dim or img.height > max_dim:
                    img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
                
                # Generar nombre único
                filename = f"{vehiculo_id}_{uuid.uuid4().hex[:8]}.webp"
                filepath = os.path.join(UPLOAD_DIR, filename)
                
                # Guardar optimizado
                img.save(filepath, "WEBP", quality=80)
                rutas_guardadas.append(filepath)
                
                # Crear registro SQLModel
                nueva_imagen = Imagen(
                    vehiculo_id=vehiculo_id,
                    ruta=f"/fotos/{filename}",
                    es_principal=(idx == 0),
                    orden=idx
                )
                self.session.add(nueva_imagen)
                imagenes_creadas.append(nueva_imagen)
                
            return imagenes_creadas
            
        except Exception as e:
            # Limpieza en caso de fallo intermedio en disco
            for path in rutas_guardadas:
                if os.path.exists(path):
                    os.remove(path)
            raise e

    def limpiar_archivos(self, imagenes_creadas: List[Imagen]):
        """Utilidad para limpiar archivos si la transacción de BD falla después"""
        for img in imagenes_creadas:
            if img.ruta.startswith("/fotos/"):
                filepath = os.path.join(UPLOAD_DIR, img.ruta.replace("/fotos/", ""))
                if os.path.exists(filepath):
                    os.remove(filepath)

    def limpiar_archivos_por_ruta(self, rutas: List[str]):
        """Utilidad para limpiar archivos a partir de rutas planas (strings)"""
        for ruta in rutas:
            if ruta.startswith("/fotos/"):
                filepath = os.path.join(UPLOAD_DIR, ruta.replace("/fotos/", ""))
                if os.path.exists(filepath):
                    os.remove(filepath)

    def rotar_imagen(self, imagen_id: int) -> Imagen:
        """Rota la imagen guardada 90 grados en sentido horario"""
        imagen = self.session.get(Imagen, imagen_id)
        if not imagen:
            raise HTTPException(status_code=404, detail="Imagen no encontrada")
        
        if imagen.ruta.startswith("/fotos/"):
            filename = imagen.ruta.split("?")[0].replace("/fotos/", "")
            filepath = os.path.join(UPLOAD_DIR, filename)
            
            if os.path.exists(filepath):
                with Image.open(filepath) as img:
                    rotated = img.rotate(-90, expand=True)
                    if rotated.mode in ("RGBA", "P"):
                        rotated = rotated.convert("RGB")
                    rotated.save(filepath, "WEBP", quality=80)
        
        return imagen
