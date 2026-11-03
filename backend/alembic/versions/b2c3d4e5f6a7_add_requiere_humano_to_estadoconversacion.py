"""add_requiere_humano_to_estadoconversacion

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-11-03 19:32:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Agrega el valor REQUIERE_HUMANO al enum estadoconversacion de PostgreSQL."""
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE estadoconversacion ADD VALUE IF NOT EXISTS 'REQUIERE_HUMANO'")


def downgrade() -> None:
    """Downgrade schema."""
    pass

