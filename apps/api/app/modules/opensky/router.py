from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.modules.auth.models import User
from app.modules.auth.router import get_current_user
from app.modules.opensky.client import OpenSkyClient, get_opensky_client
from app.modules.opensky.schemas import InboundFeed
from app.modules.opensky.service import inbound_feed

router = APIRouter()


@router.get("/inbound", response_model=InboundFeed)
async def inbound(
    session: AsyncSession = Depends(get_session),
    client: OpenSkyClient = Depends(get_opensky_client),
    current_user: User = Depends(get_current_user),
):
    """Live landing estimates for inbound flights, from OpenSky ADS-B positions."""
    is_airline = bool(current_user.role and current_user.role.name == "airline")
    return await inbound_feed(
        session,
        client,
        airline_id=current_user.airline_id if is_airline else None,
    )
