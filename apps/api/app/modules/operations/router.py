from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import Range
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crud import CrudService
from app.core.db import get_session
from app.modules.auth.models import User
from app.modules.auth.router import get_current_user, require_role
from app.modules.flights.models import Flights
from app.modules.operations.models import (
    Baggage,
    BaggageEvents,
    Bookings,
    Charges,
    Incidents,
    Passengers,
    Roles,
    Rotations,
    Shifts,
    Staff,
    StaffAssignments,
    Turnarounds,
)
from app.modules.operations.schemas import (
    BaggageCreate,
    BaggageDetailRead,
    BaggageEventCreate,
    BaggageEventRead,
    BaggageRead,
    BaggageUpdate,
    BookingCreate,
    BookingRead,
    BookingUpdate,
    ChargeCreate,
    ChargeRead,
    ChargeUpdate,
    IncidentRead,
    IncidentReport,
    IncidentUpdate,
    PassengerCreate,
    PassengerRead,
    PassengerUpdate,
    RoleCreate,
    RoleRead,
    RoleUpdate,
    RotationCreate,
    RotationRead,
    RotationUpdate,
    ShiftCreate,
    ShiftDetailRead,
    ShiftUpdate,
    StaffAssignmentCreate,
    StaffAssignmentRead,
    StaffAssignmentUpdate,
    StaffCreate,
    StaffRead,
    StaffUpdate,
    TurnaroundCreate,
    TurnaroundRead,
    TurnaroundUpdate,
)


router = APIRouter()

rotation_service = CrudService(Rotations, entity="rotation")
turnaround_service = CrudService(Turnarounds, entity="turnaround")
incident_service = CrudService(Incidents, entity="incident")
staff_service = CrudService(Staff, entity="staff member")
shift_service = CrudService(Shifts, entity="shift")
staff_assignment_service = CrudService(StaffAssignments, entity="staff assignment")
baggage_service = CrudService(Baggage, entity="baggage item")
baggage_event_service = CrudService(BaggageEvents, entity="baggage event")
charge_service = CrudService(Charges, entity="charge")
role_service = CrudService(Roles, entity="role")
passenger_service = CrudService(Passengers, entity="passenger")
booking_service = CrudService(Bookings, entity="booking")

manage_ops = require_role("admin", "ops")


def _shift_read(shift: Shifts) -> ShiftDetailRead:
    return ShiftDetailRead(
        id=shift.id,
        staff_id=shift.staff_id,
        start=shift.during.lower,
        end=shift.during.upper,
    )


# --------------------------------- rotations -------------------------------- #


@router.get("/rotations", response_model=list[RotationRead])
async def list_rotations(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await rotation_service.list(session, offset=offset, limit=limit)


@router.post("/rotations", response_model=RotationRead, status_code=status.HTTP_201_CREATED)
async def create_rotation(
    payload: RotationCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_ops),
):
    return await rotation_service.create(session, payload.model_dump())


@router.put("/rotations/{rotation_id}", response_model=RotationRead)
async def update_rotation(
    rotation_id: int,
    payload: RotationUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_ops),
):
    return await rotation_service.update(
        session, rotation_id, payload.model_dump(exclude_unset=True)
    )


@router.delete("/rotations/{rotation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rotation(
    rotation_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_ops),
):
    await rotation_service.delete(session, rotation_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# -------------------------------- turnarounds -------------------------------- #


@router.get("/turnarounds", response_model=list[TurnaroundRead])
async def list_turnarounds(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await turnaround_service.list(session, offset=offset, limit=limit)


@router.post(
    "/turnarounds", response_model=TurnaroundRead, status_code=status.HTTP_201_CREATED
)
async def create_turnaround(
    payload: TurnaroundCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_ops),
):
    return await turnaround_service.create(session, payload.model_dump())


@router.put("/turnarounds/{rotation_id}", response_model=TurnaroundRead)
async def update_turnaround(
    rotation_id: int,
    payload: TurnaroundUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("admin", "ops", "ground")),
):
    return await turnaround_service.update(
        session, rotation_id, payload.model_dump(exclude_unset=True)
    )


# --------------------------------- incidents --------------------------------- #


@router.get("/incidents", response_model=list[IncidentRead])
async def list_incidents(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await incident_service.list(session, offset=offset, limit=limit)


@router.post(
    "/incidents",
    response_model=IncidentRead,
    status_code=status.HTTP_201_CREATED,
)
async def report_incident(
    payload: IncidentReport,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("ground", "ops", "airline")),
):
    return await incident_service.create(
        session,
        {
            **payload.model_dump(),
            "reported_by": current_user.id,
            "created_at": datetime.now(timezone.utc),
        },
    )


@router.put("/incidents/{incident_id}", response_model=IncidentRead)
async def update_incident(
    incident_id: int,
    payload: IncidentUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("ground", "ops", "admin")),
):
    values = payload.model_dump(exclude_unset=True)
    if values.get("status") == "closed" and "closed_at" not in values:
        values["closed_at"] = datetime.now(timezone.utc)
    return await incident_service.update(session, incident_id, values)


@router.delete("/incidents/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_incident(
    incident_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_ops),
):
    await incident_service.delete(session, incident_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------- baggage ----------------------------------- #


@router.get("/baggage", response_model=list[BaggageDetailRead])
async def list_baggage(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    bags = list(
        (
            await session.scalars(
                select(Baggage).offset(offset).limit(limit)
            )
        ).all()
    )
    if not bags:
        return []

    booking_ids = {bag.booking_id for bag in bags}
    bookings = {
        booking.id: booking
        for booking in (
            await session.scalars(
                select(Bookings).where(Bookings.id.in_(booking_ids))
            )
        ).all()
    }
    flight_ids = {booking.flight_id for booking in bookings.values()}
    flights = {
        flight.id: flight
        for flight in (
            await session.scalars(
                select(Flights).where(Flights.id.in_(flight_ids))
            )
        ).all()
    }
    passenger_ids = {booking.passenger_id for booking in bookings.values()}
    passengers = {
        passenger.id: passenger
        for passenger in (
            await session.scalars(
                select(Passengers).where(Passengers.id.in_(passenger_ids))
            )
        ).all()
    }

    bag_ids = {bag.id for bag in bags}
    latest_scans: dict[int, BaggageEvents] = {}
    events = (
        await session.scalars(
            select(BaggageEvents)
            .where(BaggageEvents.baggage_id.in_(bag_ids))
            .order_by(BaggageEvents.scanned_at)
        )
    ).all()
    for event in events:
        latest_scans[event.baggage_id] = event

    details: list[BaggageDetailRead] = []
    for bag in bags:
        booking = bookings.get(bag.booking_id)
        flight = flights.get(booking.flight_id) if booking else None
        passenger = passengers.get(booking.passenger_id) if booking else None
        scan = latest_scans.get(bag.id)
        details.append(
            BaggageDetailRead(
                id=bag.id,
                booking_id=bag.booking_id,
                flight_id=booking.flight_id if booking else 0,
                flight_no=flight.flight_no if flight else None,
                passenger_name=passenger.name if passenger else None,
                tag=bag.tag,
                weight_kg=bag.weight_kg,
                last_location=scan.location if scan else None,
                last_scanned_at=scan.scanned_at if scan else None,
            )
        )
    return details


@router.post("/baggage/raw", response_model=BaggageRead, status_code=status.HTTP_201_CREATED)
async def create_baggage(
    payload: BaggageCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("ground", "ops", "admin")),
):
    return await baggage_service.create(session, payload.model_dump())


@router.put("/baggage/raw/{baggage_id}", response_model=BaggageRead)
async def update_baggage(
    baggage_id: int,
    payload: BaggageUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("ground", "ops", "admin")),
):
    return await baggage_service.update(
        session, baggage_id, payload.model_dump(exclude_unset=True)
    )


@router.delete("/baggage/raw/{baggage_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_baggage(
    baggage_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_ops),
):
    await baggage_service.delete(session, baggage_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/baggage-events", response_model=list[BaggageEventRead])
async def list_baggage_events(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.scalars(
        select(BaggageEvents).offset(offset).limit(limit)
    )
    return list(result.all())


@router.post(
    "/baggage-events",
    response_model=BaggageEventRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_baggage_event(
    payload: BaggageEventCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("ground", "ops", "admin")),
):
    return await baggage_event_service.create(session, payload.model_dump())


# ----------------------------------- staff ------------------------------------ #


@router.get("/staff", response_model=list[StaffRead])
async def list_staff(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await staff_service.list(session, offset=offset, limit=limit)


@router.post("/staff", response_model=StaffRead, status_code=status.HTTP_201_CREATED)
async def create_staff(
    payload: StaffCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_ops),
):
    return await staff_service.create(session, payload.model_dump())


@router.put("/staff/{staff_id}", response_model=StaffRead)
async def update_staff(
    staff_id: int,
    payload: StaffUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_ops),
):
    return await staff_service.update(
        session, staff_id, payload.model_dump(exclude_unset=True)
    )


@router.delete("/staff/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_staff(
    staff_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_ops),
):
    await staff_service.delete(session, staff_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ----------------------------------- shifts ------------------------------------ #


@router.get("/shifts", response_model=list[ShiftDetailRead])
async def list_shifts(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    shifts = list(
        (
            await session.scalars(
                select(Shifts).offset(offset).limit(limit)
            )
        ).all()
    )
    return [_shift_read(shift) for shift in shifts if shift.during is not None]


@router.post("/shifts", response_model=ShiftDetailRead, status_code=status.HTTP_201_CREATED)
async def create_shift(
    payload: ShiftCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_ops),
):
    shift = await shift_service.create(
        session,
        {
            "staff_id": payload.staff_id,
            "during": Range(payload.start, payload.end),
        },
    )
    return _shift_read(shift)


@router.put("/shifts/{shift_id}", response_model=ShiftDetailRead)
async def update_shift(
    shift_id: int,
    payload: ShiftUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_ops),
):
    values = payload.model_dump(exclude_unset=True, exclude={"start", "end"})
    if payload.start is not None or payload.end is not None:
        current = await shift_service.get(session, shift_id)
        start = payload.start or current.during.lower
        end = payload.end or current.during.upper
        values["during"] = Range(start, end)
    shift = await shift_service.update(session, shift_id, values)
    return _shift_read(shift)


@router.delete("/shifts/{shift_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shift(
    shift_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_ops),
):
    await shift_service.delete(session, shift_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ------------------------------ staff assignments ------------------------------ #


@router.get("/staff-assignments", response_model=list[StaffAssignmentRead])
async def list_staff_assignments(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await staff_assignment_service.list(
        session, offset=offset, limit=limit
    )


@router.post(
    "/staff-assignments",
    response_model=StaffAssignmentRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_staff_assignment(
    payload: StaffAssignmentCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_ops),
):
    return await staff_assignment_service.create(session, payload.model_dump())


@router.put("/staff-assignments/{assignment_id}", response_model=StaffAssignmentRead)
async def update_staff_assignment(
    assignment_id: int,
    payload: StaffAssignmentUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_ops),
):
    return await staff_assignment_service.update(
        session, assignment_id, payload.model_dump(exclude_unset=True)
    )


@router.delete(
    "/staff-assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_staff_assignment(
    assignment_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_ops),
):
    await staff_assignment_service.delete(session, assignment_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------- charges ------------------------------------ #


@router.get("/charges", response_model=list[ChargeRead])
async def list_charges(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await charge_service.list(session, offset=offset, limit=limit)


@router.post("/charges", response_model=ChargeRead, status_code=status.HTTP_201_CREATED)
async def create_charge(
    payload: ChargeCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_ops),
):
    return await charge_service.create(session, payload.model_dump())


@router.put("/charges/{charge_id}", response_model=ChargeRead)
async def update_charge(
    charge_id: int,
    payload: ChargeUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_ops),
):
    return await charge_service.update(
        session, charge_id, payload.model_dump(exclude_unset=True)
    )


@router.delete("/charges/{charge_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_charge(
    charge_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_ops),
):
    await charge_service.delete(session, charge_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ----------------------------------- roles ------------------------------------- #


@router.get("/roles", response_model=list[RoleRead])
async def list_roles(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await role_service.list(session, offset=0, limit=500)


@router.post("/roles", response_model=RoleRead, status_code=status.HTTP_201_CREATED)
async def create_role(
    payload: RoleCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("admin")),
):
    return await role_service.create(session, payload.model_dump())


@router.put("/roles/{role_id}", response_model=RoleRead)
async def update_role(
    role_id: int,
    payload: RoleUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("admin")),
):
    return await role_service.update(
        session, role_id, payload.model_dump(exclude_unset=True)
    )


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("admin")),
):
    await role_service.delete(session, role_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --------------------------------- passengers ----------------------------------- #


@router.get("/passengers", response_model=list[PassengerRead])
async def list_passengers(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await passenger_service.list(session, offset=offset, limit=limit)


@router.post(
    "/passengers", response_model=PassengerRead, status_code=status.HTTP_201_CREATED
)
async def create_passenger(
    payload: PassengerCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("ground", "ops", "admin")),
):
    return await passenger_service.create(session, payload.model_dump())


@router.put("/passengers/{passenger_id}", response_model=PassengerRead)
async def update_passenger(
    passenger_id: int,
    payload: PassengerUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("ground", "ops", "admin")),
):
    return await passenger_service.update(
        session, passenger_id, payload.model_dump(exclude_unset=True)
    )


@router.delete("/passengers/{passenger_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_passenger(
    passenger_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_ops),
):
    await passenger_service.delete(session, passenger_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------- bookings ------------------------------------ #


@router.get("/bookings", response_model=list[BookingRead])
async def list_bookings(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await booking_service.list(session, offset=offset, limit=limit)


@router.post(
    "/bookings", response_model=BookingRead, status_code=status.HTTP_201_CREATED
)
async def create_booking(
    payload: BookingCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("ground", "ops", "admin")),
):
    return await booking_service.create(session, payload.model_dump())


@router.put("/bookings/{booking_id}", response_model=BookingRead)
async def update_booking(
    booking_id: int,
    payload: BookingUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("ground", "ops", "admin")),
):
    return await booking_service.update(
        session, booking_id, payload.model_dump(exclude_unset=True)
    )


@router.delete("/bookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_booking(
    booking_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_ops),
):
    await booking_service.delete(session, booking_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
