"""add_origen_compra_and_precio_compra

Revision ID: 76e4d9b817a9
Revises: 553fa419d941
Create Date: 2026-08-03 20:12:05.458369

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '76e4d9b817a9'
down_revision: Union[str, Sequence[str], None] = '553fa419d941'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Renombrar columna sin perder datos
    op.alter_column('vehiculos', 'precio', new_column_name='precio_venta')
    # Agregar nuevas columnas
    op.add_column('vehiculos', sa.Column('precio_compra', sa.Float(), nullable=True))
    op.add_column('vehiculos', sa.Column('origen_compra', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Eliminar nuevas columnas
    op.drop_column('vehiculos', 'origen_compra')
    op.drop_column('vehiculos', 'precio_compra')
    # Restaurar nombre original
    op.alter_column('vehiculos', 'precio_venta', new_column_name='precio')
