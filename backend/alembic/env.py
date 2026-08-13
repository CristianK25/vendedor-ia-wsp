from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
from sqlmodel import SQLModel
from app.Core.config import settings

# Importar todos los modelos para que alembic los registre en la metadata
from app.Modules.usuarios.model import Usuario, RefreshToken, PasswordResetToken
from app.Modules.clientes.model import Cliente
from app.Modules.vehiculos.model import Vehiculo
from app.Modules.documentos.model import DocumentoVehiculo
from app.Modules.imagenes.model import Imagen
from app.Modules.citas.model import Cita
from app.Modules.ventas.model import Venta
from app.Modules.promociones.model import Promocion
from app.Modules.resenas.model import Resena
from app.Modules.etiquetas.model import Etiqueta
from app.Modules.peticiones.model import Peticion
from app.Modules.interacciones.model import Interaccion

target_metadata = SQLModel.metadata

# Configurar la URL de la base de datos usando las settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table" and name in ("n8n_chat_histories",):
        return False
    return True

def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata,
            include_object=include_object
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
