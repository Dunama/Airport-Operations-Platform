from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.modules.auth.router import get_current_user, require_role
from app.modules.auth.models import User
from app.modules.airports.models import Airports
from app.modules.airports.schemas import AirportCreate, AirportRead
from app.modules.airports.service import AirportService


router = APIRouter()
airport_service = AirportService(Airports)


@router.get("", response_model=list[AirportRead])
async def list_airports(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await airport_service.list(session, offset=offset, limit=limit)


@router.post("", response_model=AirportRead, status_code=status.HTTP_201_CREATED)
async def create_airport(
    payload: AirportCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("admin", "ops")),
):
    return await airport_service.create(session, payload.model_dump())


@router.get("/{airport_id}", response_model=AirportRead)
async def get_airport(
    airport_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await airport_service.get(session, airport_id)
