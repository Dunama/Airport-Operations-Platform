from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.modules.flights.models import Airports, Flights
from app.modules.flights.schemas import (
    AirportCreate,
    AirportRead,
    FlightCreate,
    FlightRead,
)
from app.modules.flights.service import CrudService


router = APIRouter()
airport_service = CrudService(Airports)
flight_service = CrudService(Flights)


@router.get("/airports", response_model=list[AirportRead])
async def list_airports(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
):
    return await airport_service.list(session, offset=offset, limit=limit)


@router.post(
    "/airports",
    response_model=AirportRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_airport(
    payload: AirportCreate,
    session: AsyncSession = Depends(get_session),
):
    return await airport_service.create(session, payload.model_dump())


@router.get("/airports/{airport_id}", response_model=AirportRead)
async def get_airport(
    airport_id: int,
    session: AsyncSession = Depends(get_session),
):
    return await airport_service.get(session, airport_id)


@router.get("/flights", response_model=list[FlightRead])
async def list_flights(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
):
    return await flight_service.list(session, offset=offset, limit=limit)


@router.post(
    "/flights",
    response_model=FlightRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_flight(
    payload: FlightCreate,
    session: AsyncSession = Depends(get_session),
):
    return await flight_service.create(session, payload.model_dump())


@router.get("/flights/{flight_id}", response_model=FlightRead)
async def get_flight(
    flight_id: int,
    session: AsyncSession = Depends(get_session),
):
    return await flight_service.get(session, flight_id)


@router.delete(
    "/flights/{flight_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_flight(
    flight_id: int,
    session: AsyncSession = Depends(get_session),
):
    await flight_service.delete(session, flight_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
