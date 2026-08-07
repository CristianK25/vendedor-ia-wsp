"""add_stock_role_to_enum

Revision ID: 13c2c5058a32
Revises: 6c7d52638418
Create Date: 2026-08-07 14:11:51.001322

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '13c2c5058a32'
down_revision: Union[str, Sequence[str], None] = '6c7d52638418'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'STOCK'")


def downgrade() -> None:
    """Downgrade schema."""
    pass
