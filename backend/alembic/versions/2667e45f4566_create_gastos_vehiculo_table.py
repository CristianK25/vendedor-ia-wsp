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
    # Crear el enum solo si no existe en PostgreSQL
    op.execute(
        "DO $$ BEGIN "
        "IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoriagasto') THEN "
        "CREATE TYPE categoriagasto AS ENUM ('mecanica', 'detailing_preparacion', 'repuestos', 'flete', 'patentes_tramites', 'otros'); "
        "END IF; END $$;"
    )

    categoria_enum = sa.Enum(
        'mecanica',
        'detailing_preparacion',
        'repuestos',
        'flete',
        'patentes_tramites',
        'otros',
        name='categoriagasto',
        create_type=False
    )

    op.create_table(
        'gastos_vehiculo',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('vehiculo_id', sa.Integer(), nullable=False),
        sa.Column('fecha', sa.Date(), nullable=False),
        sa.Column('categoria', categoria_enum, nullable=False),
        sa.Column('monto', sa.Float(), nullable=False),
        sa.Column('proveedor', sa.String(), nullable=False),
        sa.Column('factura_a', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('comprobante_url', sa.String(length=500), nullable=True),
        sa.Column('fecha_hora_carga', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['vehiculo_id'], ['vehiculos.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('gastos_vehiculo')
    categoria_enum = sa.Enum(
        'mecanica',
        'detailing_preparacion',
        'repuestos',
        'flete',
        'patentes_tramites',
        'otros',
        name='categoriagasto'
    )
    categoria_enum.drop(op.get_bind(), checkfirst=True)
