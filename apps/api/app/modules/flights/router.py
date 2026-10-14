from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.modules.auth.models import User
from app.modules.auth.router import get_current_user, require_role
from app.modules.flights.models import Flights
from app.modules.flights.schemas import FlightCreate, FlightRead
from app.modules.flights.service import FlightService


router = APIRouter()
flight_service = FlightService(Flights)


@router.get("", response_model=list[FlightRead])
async def list_flights(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role and current_user.role.name == "airline":
        return await flight_service.list_for_airline(
            session,
            current_user.airline_id,
            offset=offset,
            limit=limit,
        )
    return await flight_service.list(session, offset=offset, limit=limit)


@router.post("", response_model=FlightRead, status_code=status.HTTP_201_CREATED)
async def create_flight(
    payload: FlightCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("admin", "ops")),
):
    return await flight_service.create(session, payload.model_dump())


@router.get("/{flight_id}", response_model=FlightRead)
async def get_flight(
    flight_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    flight = await flight_service.get(session, flight_id)
    if (
        current_user.role
        and current_user.role.name == "airline"
        and flight.airline_id != current_user.airline_id
    ):
        raise HTTPException(status_code=404, detail="Flight not found")
    return flight


@router.delete("/{flight_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_flight(
    flight_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("admin", "ops")),
):
    await flight_service.delete(session, flight_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
