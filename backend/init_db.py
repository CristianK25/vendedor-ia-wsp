import logging
import subprocess
import sys
from sqlalchemy import inspect
from sqlmodel import SQLModel

# Asegurar que se importan todos los modelos para que estén registrados en SQLModel.metadata
from app.Core.database import engine
from app.Modules.usuarios.model import Usuario, RefreshToken, PasswordResetToken
from app.Modules.clientes.model import Cliente
from app.Modules.vehiculos.model import Vehiculo
from app.Modules.imagenes.model import Imagen
from app.Modules.trabajadores.model import Trabajador
from app.Modules.citas.model import Cita
from app.Modules.ventas.model import Venta
from app.Modules.promociones.model import Promocion
from app.Modules.resenas.model import Resena
from app.Modules.etiquetas.model import Etiqueta
from app.Modules.peticiones.model import Peticion

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("init_db")

def init_database():
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        # Consideramos vacía si no hay ninguna tabla
        if len(tables) == 0:
            logger.info("La base de datos está completamente vacía. Creando todas las tablas usando SQLModel...")
            SQLModel.metadata.create_all(engine)
            logger.info("Tablas creadas. Estampando alembic en 'head'...")
            subprocess.run(["alembic", "stamp", "head"], check=True)
            logger.info("Base de datos estampada en 'head' exitosamente.")
        else:
            logger.info("La base de datos ya contiene tablas. Ejecutando migraciones de Alembic...")
            subprocess.run(["alembic", "upgrade", "head"], check=True)
            logger.info("Migraciones de Alembic completadas exitosamente.")
            
    except Exception as e:
        logger.error(f"Error durante la inicialización de la base de datos: {e}")
        sys.exit(1)

if __name__ == "__main__":
    init_database()
