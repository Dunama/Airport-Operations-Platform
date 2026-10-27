from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crud import CrudService
from app.core.db import get_session
from app.modules.auth.router import get_current_user, require_role
from app.modules.auth.models import User
from app.modules.airports.models import Airports, Terminals
from app.modules.operations.models import WeatherObservations
from app.modules.airports.schemas import (
    AirportCreate,
    AirportRead,
    AirportUpdate,
    TerminalCreate,
    TerminalRead,
    TerminalUpdate,
    WeatherObservationCreate,
    WeatherObservationRead,
)
from app.modules.airports.service import AirportService


router = APIRouter()
terminal_router = APIRouter()
weather_router = APIRouter()

airport_service = AirportService(Airports, entity="airport")
terminal_service = CrudService(Terminals, entity="terminal")
weather_service = CrudService(WeatherObservations, entity="weather observation")

manage_airports = require_role("admin", "ops")


@router.get("", response_model=list[AirportRead])
async def list_airports(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    search: str | None = Query(default=None, max_length=100),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if search:
        return await airport_service.search(
            session, search, offset=offset, limit=limit
        )
    return await airport_service.list(session, offset=offset, limit=limit)


@router.get("/count")
async def count_airports(
    search: str | None = Query(default=None, max_length=100),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return {"total": await airport_service.count(session, search)}


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


@router.put("/{airport_id}", response_model=AirportRead)
async def update_airport(
    airport_id: int,
    payload: AirportUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("admin", "ops")),
):
    return await airport_service.update(
        session, airport_id, payload.model_dump(exclude_unset=True)
    )


@router.delete("/{airport_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_airport(
    airport_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("admin", "ops")),
):
    await airport_service.delete(session, airport_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@terminal_router.get("", response_model=list[TerminalRead])
async def list_terminals(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await terminal_service.list(session, offset=offset, limit=limit)


@terminal_router.post(
    "", response_model=TerminalRead, status_code=status.HTTP_201_CREATED
)
async def create_terminal(
    payload: TerminalCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_airports),
):
    return await terminal_service.create(session, payload.model_dump())


@terminal_router.get("/{terminal_id}", response_model=TerminalRead)
async def get_terminal(
    terminal_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await terminal_service.get(session, terminal_id)


@terminal_router.put("/{terminal_id}", response_model=TerminalRead)
async def update_terminal(
    terminal_id: int,
    payload: TerminalUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_airports),
):
    return await terminal_service.update(
        session, terminal_id, payload.model_dump(exclude_unset=True)
    )


@terminal_router.delete("/{terminal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_terminal(
    terminal_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_airports),
):
    await terminal_service.delete(session, terminal_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@weather_router.get("", response_model=list[WeatherObservationRead])
async def list_weather_observations(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await weather_service.list(session, offset=offset, limit=limit)


@weather_router.post(
    "", response_model=WeatherObservationRead, status_code=status.HTTP_201_CREATED
)
async def create_weather_observation(
    payload: WeatherObservationCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_airports),
):
    return await weather_service.create(session, payload.model_dump())
