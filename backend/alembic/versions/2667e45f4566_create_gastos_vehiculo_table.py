"""create_gastos_vehiculo_table

Revision ID: 2667e45f4566
Revises: 0593f2fa4de1
Create Date: 2026-08-17 14:33:24.865402

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2667e45f4566'
down_revision: Union[str, Sequence[str], None] = '0593f2fa4de1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoriagasto') THEN
                CREATE TYPE categoriagasto AS ENUM ('mecanica', 'detailing_preparacion', 'repuestos', 'flete', 'patentes_tramites', 'otros');
            END IF;
        END $$;

        CREATE TABLE IF NOT EXISTS gastos_vehiculo (
            id SERIAL PRIMARY KEY,
            vehiculo_id INTEGER NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
            fecha DATE NOT NULL,
            categoria categoriagasto NOT NULL,
            monto DOUBLE PRECISION NOT NULL,
            proveedor VARCHAR NOT NULL,
            factura_a BOOLEAN NOT NULL DEFAULT false,
            comprobante_url VARCHAR(500),
            fecha_hora_carga TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (now() at time zone 'utc')
        );
    """)


def downgrade() -> None:
    op.execute("""
        DROP TABLE IF EXISTS gastos_vehiculo;
        DROP TYPE IF EXISTS categoriagasto;
    """)
