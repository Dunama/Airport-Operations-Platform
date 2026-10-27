from datetime import datetime

from pydantic import Field

from app.core.schemas import Schema


class ActivityLogRead(Schema):
    id: int
    actor_id: int
    action: str = Field(pattern="^(create|update|delete)$")
    entity: str
    summary: str
    created_at: datetime
