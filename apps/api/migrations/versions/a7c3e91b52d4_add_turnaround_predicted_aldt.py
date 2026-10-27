"""add turnaround predicted_aldt

Revision ID: a7c3e91b52d4
Revises: d1976ad0c270
Create Date: 2026-10-27 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7c3e91b52d4'
down_revision: Union[str, Sequence[str], None] = 'd1976ad0c270'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'turnarounds',
        sa.Column('predicted_aldt', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('turnarounds', 'predicted_aldt')
