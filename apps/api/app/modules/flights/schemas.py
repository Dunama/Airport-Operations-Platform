from datetime import datetime
from typing import Any

from pydantic import Field

from app.core.schemas import Schema


class FlightBase(Schema):
    airline_id: int
    origin_id: int
    dest_id: int
    flight_no: str = Field(min_length=1, max_length=20)
    direction: str = Field(pattern="^(ARR|DEP|IN|OUT)$")
    sched_time: datetime
    est_time: datetime | None = None
    actual_time: datetime | None = None
    status: str = Field(min_length=1, max_length=20)
    version: int = Field(default=1, ge=1)


class FlightCreate(FlightBase):
    """Create a movement.

    Either attach it to an existing ``rotation_id`` or supply an
    ``aircraft_id`` and the API will create a rotation (and its turnaround)
    automatically.
    """

    rotation_id: int | None = None
    aircraft_id: int | None = None


class FlightUpdate(Schema):
    airline_id: int | None = None
    origin_id: int | None = None
    dest_id: int | None = None
    flight_no: str | None = Field(default=None, min_length=1, max_length=20)
    direction: str | None = Field(default=None, pattern="^(ARR|DEP|IN|OUT)$")
    sched_time: datetime | None = None
    est_time: datetime | None = None
    actual_time: datetime | None = None
    status: str | None = Field(default=None, min_length=1, max_length=20)


class FlightRead(FlightBase):
    id: int
    rotation_id: int


class FlightEventBase(Schema):
    flight_id: int
    actor_user_id: int
    type: str = Field(min_length=1, max_length=50)
    payload: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class FlightEventCreate(FlightEventBase):
    pass


class FlightEventRead(FlightEventBase):
    id: int


class DelayPredictionBase(Schema):
    flight_id: int
    model_version: str = Field(min_length=1, max_length=50)
    p_delay_15: float = Field(ge=0, le=1)
    expected_delay_min: float = Field(ge=0)
    top_factors: dict[str, Any] = Field(default_factory=dict)
    scored_at: datetime


class DelayPredictionCreate(DelayPredictionBase):
    pass


class DelayPredictionRead(DelayPredictionBase):
    id: int


from app.modules.airlines.schemas import (
    AircraftBase,
    AircraftCreate,
    AircraftRead,
    AircraftTypeBase,
    AircraftTypeCreate,
    AircraftTypeRead,
    AirlineBase,
    AirlineCreate,
    AirlineRead,
)
from app.modules.airports.schemas import (
    AirportBase,
    AirportCreate,
    AirportRead,
    TerminalBase,
    TerminalCreate,
    TerminalRead,
)
from app.modules.gates.schemas import (
    GateAssignmentBase,
    GateAssignmentCreate,
    GateAssignmentRead,
    GateBase,
    GateCreate,
    GateRead,
    OptimizationRunBase,
    OptimizationRunCreate,
    OptimizationRunRead,
)
from app.modules.operations.schemas import (
    BaggageBase,
    BaggageCreate,
    BaggageEventBase,
    BaggageEventCreate,
    BaggageEventRead,
    BaggageRead,
    BookingBase,
    BookingCreate,
    BookingRead,
    ChargeBase,
    ChargeCreate,
    ChargeRead,
    IncidentBase,
    IncidentCreate,
    IncidentRead,
    PassengerBase,
    PassengerCreate,
    PassengerRead,
    RoleBase,
    RoleCreate,
    RoleRead,
    RotationBase,
    RotationCreate,
    RotationRead,
    ShiftBase,
    ShiftCreate,
    ShiftRead,
    StaffAssignmentBase,
    StaffAssignmentCreate,
    StaffAssignmentRead,
    StaffBase,
    StaffCreate,
    StaffRead,
    TurnaroundBase,
    TurnaroundCreate,
    TurnaroundRead,
    UserBase,
    UserRead,
)
