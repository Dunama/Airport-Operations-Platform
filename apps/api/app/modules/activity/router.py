from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.modules.activity.models import ActivityLog
from app.modules.activity.schemas import ActivityLogRead
from app.modules.auth.models import User
from app.modules.auth.router import require_role


router = APIRouter()


@router.get("", response_model=list[ActivityLogRead])
async def list_activity(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("admin", "ops")),
):
    result = await session.scalars(
        select(ActivityLog)
        .order_by(ActivityLog.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return list(result.all())
