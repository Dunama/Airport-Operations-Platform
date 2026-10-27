from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crud import CrudService
from app.core.db import get_session
from app.modules.auth.models import User
from app.modules.auth.router import get_current_user, require_role
from app.modules.flights.models import DelayPredictions, FlightEvents, Flights
from app.modules.flights.schemas import (
    DelayPredictionCreate,
    DelayPredictionRead,
    FlightCreate,
    FlightEventCreate,
    FlightEventRead,
    FlightRead,
    FlightUpdate,
)
from app.modules.flights.service import FlightService


router = APIRouter()
event_router = APIRouter()
delay_prediction_router = APIRouter()

flight_service = FlightService(Flights, entity="flight")
flight_event_service = CrudService(FlightEvents, entity="flight event")
delay_prediction_service = CrudService(DelayPredictions, entity="delay prediction")


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
    return await flight_service.create_movement(
        session, payload.model_dump(exclude_unset=True)
    )


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


@router.put("/{flight_id}", response_model=FlightRead)
async def update_flight(
    flight_id: int,
    payload: FlightUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("admin", "ops")),
):
    return await flight_service.update_movement(
        session, flight_id, payload.model_dump(exclude_unset=True)
    )


@router.delete("/{flight_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_flight(
    flight_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("admin", "ops")),
):
    await flight_service.delete(session, flight_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@event_router.get("", response_model=list[FlightEventRead])
async def list_flight_events(
    flight_id: int | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = select(FlightEvents).offset(offset).limit(limit)
    if flight_id is not None:
        stmt = stmt.where(FlightEvents.flight_id == flight_id)
    return list((await session.scalars(stmt)).all())


@event_router.post("", response_model=FlightEventRead, status_code=status.HTTP_201_CREATED)
async def create_flight_event(
    payload: FlightEventCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("ground", "ops", "admin")),
):
    return await flight_event_service.create(session, payload.model_dump())


@delay_prediction_router.get("", response_model=list[DelayPredictionRead])
async def list_delay_predictions(
    flight_id: int | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = select(DelayPredictions).offset(offset).limit(limit)
    if flight_id is not None:
        stmt = stmt.where(DelayPredictions.flight_id == flight_id)
    return list((await session.scalars(stmt)).all())
    


@delay_prediction_router.post(
    "", response_model=DelayPredictionRead, status_code=status.HTTP_201_CREATED
)
async def create_delay_prediction(
    payload: DelayPredictionCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("admin", "ops")),
):
    return await delay_prediction_service.create(session, payload.model_dump())
