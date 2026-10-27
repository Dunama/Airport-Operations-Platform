from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crud import CrudService
from app.core.db import get_session
from app.modules.airlines.models import Aircraft, AircraftTypes, Airlines
from app.modules.airlines.schemas import (
    AircraftCreate,
    AircraftRead,
    AircraftTypeCreate,
    AircraftTypeRead,
    AircraftTypeUpdate,
    AircraftUpdate,
    AirlineCreate,
    AirlineRead,
    AirlineUpdate,
)
from app.modules.auth.models import User
from app.modules.auth.router import get_current_user, require_role


router = APIRouter()
aircraft_router = APIRouter()
aircraft_type_router = APIRouter()

airline_service = CrudService(Airlines, entity="airline")
aircraft_service = CrudService(Aircraft, entity="aircraft")
aircraft_type_service = CrudService(AircraftTypes, entity="aircraft type")

manage_airlines = require_role("admin", "ops")


@router.get("", response_model=list[AirlineRead])
async def list_airlines(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await airline_service.list(session, offset=offset, limit=limit)


@router.post("", response_model=AirlineRead, status_code=status.HTTP_201_CREATED)
async def create_airline(
    payload: AirlineCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_airlines),
):
    return await airline_service.create(session, payload.model_dump())


@router.get("/{airline_id}", response_model=AirlineRead)
async def get_airline(
    airline_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await airline_service.get(session, airline_id)


@router.put("/{airline_id}", response_model=AirlineRead)
async def update_airline(
    airline_id: int,
    payload: AirlineUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_airlines),
):
    return await airline_service.update(
        session, airline_id, payload.model_dump(exclude_unset=True)
    )


@router.delete("/{airline_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_airline(
    airline_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_airlines),
):
    await airline_service.delete(session, airline_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@aircraft_type_router.get("", response_model=list[AircraftTypeRead])
async def list_aircraft_types(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await aircraft_type_service.list(session, offset=offset, limit=limit)


@aircraft_type_router.post(
    "", response_model=AircraftTypeRead, status_code=status.HTTP_201_CREATED
)
async def create_aircraft_type(
    payload: AircraftTypeCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_airlines),
):
    return await aircraft_type_service.create(session, payload.model_dump())


@aircraft_type_router.put("/{type_id}", response_model=AircraftTypeRead)
async def update_aircraft_type(
    type_id: int,
    payload: AircraftTypeUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_airlines),
):
    return await aircraft_type_service.update(
        session, type_id, payload.model_dump(exclude_unset=True)
    )


@aircraft_type_router.delete(
    "/{type_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_aircraft_type(
    type_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_airlines),
):
    await aircraft_type_service.delete(session, type_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@aircraft_router.get("", response_model=list[AircraftRead])
async def list_aircraft(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await aircraft_service.list(session, offset=offset, limit=limit)


@aircraft_router.post(
    "", response_model=AircraftRead, status_code=status.HTTP_201_CREATED
)
async def create_aircraft(
    payload: AircraftCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_airlines),
):
    return await aircraft_service.create(session, payload.model_dump())


@aircraft_router.get("/{aircraft_id}", response_model=AircraftRead)
async def get_aircraft(
    aircraft_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await aircraft_service.get(session, aircraft_id)


@aircraft_router.put("/{aircraft_id}", response_model=AircraftRead)
async def update_aircraft(
    aircraft_id: int,
    payload: AircraftUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_airlines),
):
    return await aircraft_service.update(
        session, aircraft_id, payload.model_dump(exclude_unset=True)
    )


@aircraft_router.delete("/{aircraft_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_aircraft(
    aircraft_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_airlines),
):
    await aircraft_service.delete(session, aircraft_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
