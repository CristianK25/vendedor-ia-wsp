"""create_agent_chat_messages_table

Revision ID: a1b2c3d4e5f6
Revises: f2e5fb084901
Create Date: 2026-10-28 15:25:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f2e5fb084901'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Crea la tabla agent_chat_messages y su índice compuesto de forma idempotente."""
    op.execute("""
        CREATE TABLE IF NOT EXISTS agent_chat_messages (
            id SERIAL PRIMARY KEY,
            session_id VARCHAR(64) NOT NULL,
            role VARCHAR(16) NOT NULL,
            content TEXT NOT NULL,
            camino VARCHAR(32),
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (now() at time zone 'utc')
        );

        CREATE INDEX IF NOT EXISTS ix_agent_chat_messages_session_id
            ON agent_chat_messages (session_id);

        CREATE INDEX IF NOT EXISTS ix_agent_chat_messages_session_created
            ON agent_chat_messages (session_id, created_at);
    """)


def downgrade() -> None:
    """Elimina la tabla agent_chat_messages y sus índices."""
    op.execute("""
        DROP INDEX IF EXISTS ix_agent_chat_messages_session_created;
        DROP INDEX IF EXISTS ix_agent_chat_messages_session_id;
        DROP TABLE IF EXISTS agent_chat_messages;
    """)

