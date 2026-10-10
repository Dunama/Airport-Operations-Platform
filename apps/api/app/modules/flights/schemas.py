from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class Schema(BaseModel):
    ''' Base schema class for all Pydantic models in the flights module.'''
    model_config = ConfigDict(from_attributes=True)


class AirportBase(Schema):
    iata: str = Field(min_length=3, max_length=3)
    icao: str = Field(min_length=4, max_length=4)
    name: str = Field(min_length=1, max_length=100)
    timezone: str = Field(min_length=1, max_length=50)


class AirportCreate(AirportBase):
    pass


class AirportRead(AirportBase):
    id: int


class TerminalBase(Schema):
    airport_id: int
    code: str = Field(min_length=1, max_length=10)


class TerminalCreate(TerminalBase):
    pass


class TerminalRead(TerminalBase):
    id: int


class GateBase(Schema):
    terminal_id: int
    code: str = Field(min_length=1, max_length=10)
    kind: str = Field(pattern="^(contact|remote)$")
    max_size: str = Field(pattern="^[CDEF]$")
    intl_capable: bool = False
    status: str = Field(default="open", pattern="^(open|closed|maintenance)$")


class GateCreate(GateBase):
    pass


class GateRead(GateBase):
    id: int


class AirlineBase(Schema):
    iata: str = Field(min_length=2, max_length=3)
    name: str = Field(min_length=1, max_length=100)


class AirlineCreate(AirlineBase):
    pass


class AirlineRead(AirlineBase):
    id: int


class AircraftTypeBase(Schema):
    icao_code: str = Field(min_length=1, max_length=4)
    size: str = Field(min_length=1, max_length=20)
    seats: int = Field(gt=0)
    typical_turn_min: int = Field(gt=0)


class AircraftTypeCreate(AircraftTypeBase):
    pass


class AircraftTypeRead(AircraftTypeBase):
    id: int


class AircraftBase(Schema):
    registration: str = Field(min_length=1, max_length=20)
    airline_id: int
    type_id: int


class AircraftCreate(AircraftBase):
    pass


class AircraftRead(AircraftBase):
    id: int


class RotationBase(Schema):
    aircraft_id: int
    on_block_planned: datetime
    off_block_planned: datetime


class RotationCreate(RotationBase):
    pass


class RotationRead(RotationBase):
    id: int


class FlightBase(Schema):
    rotation_id: int
    airline_id: int
    origin_id: int
    dest_id: int
    flight_no: str = Field(min_length=1, max_length=20)
    direction: str = Field(pattern="^(ARR|DEP)$")
    sched_time: datetime
    est_time: datetime | None = None
    actual_time: datetime | None = None
    status: str = Field(min_length=1, max_length=20)
    version: int = Field(default=1, ge=1)


class FlightCreate(FlightBase):
    pass


class FlightRead(FlightBase):
    id: int


class TurnaroundBase(Schema):
    aldt: datetime | None = None
    aibt: datetime | None = None
    tobt: datetime | None = None
    tsat: datetime | None = None
    aobt: datetime | None = None
    atot: datetime | None = None
    predicted_ready: datetime | None = None


class TurnaroundCreate(TurnaroundBase):
    rotation_id: int


class TurnaroundRead(TurnaroundBase):
    rotation_id: int


class OptimizationRunBase(Schema):
    requested_by: int
    horizon_start: datetime
    horizon_end: datetime
    n_flights: int = Field(ge=0)
    status: str = Field(min_length=1, max_length=20)
    objective: Decimal | None = None
    solve_ms: int | None = Field(default=None, ge=0)


class OptimizationRunCreate(OptimizationRunBase):
    pass


class OptimizationRunRead(OptimizationRunBase):
    id: int


class GateAssignmentBase(Schema):
    rotation_id: int
    gate_id: int
    run_id: int
    during: Any
    source: str = Field(pattern="^(manual|greedy|optimizer)$")
    is_active: bool = True


class GateAssignmentCreate(GateAssignmentBase):
    pass


class GateAssignmentRead(GateAssignmentBase):
    id: int


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


class PassengerBase(Schema):
    name: str = Field(min_length=1, max_length=100)
    nationality: str = Field(min_length=1, max_length=50)


class PassengerCreate(PassengerBase):
    pass


class PassengerRead(PassengerBase):
    id: int


class BookingBase(Schema):
    flight_id: int
    passenger_id: int
    seat: str = Field(min_length=1, max_length=10)
    checked_in_at: datetime | None = None
    boarded_at: datetime | None = None


class BookingCreate(BookingBase):
    pass


class BookingRead(BookingBase):
    id: int


class BaggageBase(Schema):
    booking_id: int
    tag: str = Field(min_length=1, max_length=50)
    weight_kg: Decimal = Field(gt=0)


class BaggageCreate(BaggageBase):
    pass


class BaggageRead(BaggageBase):
    id: int


class BaggageEventBase(Schema):
    baggage_id: int
    location: str = Field(min_length=1, max_length=100)
    scanned_at: datetime


class BaggageEventCreate(BaggageEventBase):
    pass


class BaggageEventRead(BaggageEventBase):
    id: int


class StaffBase(Schema):
    user_id: int
    name: str = Field(min_length=1, max_length=100)
    skill: str = Field(min_length=1, max_length=50)


class StaffCreate(StaffBase):
    pass


class StaffRead(StaffBase):
    id: int


class ShiftBase(Schema):
    staff_id: int
    during: Any


class ShiftCreate(ShiftBase):
    pass


class ShiftRead(ShiftBase):
    id: int


class StaffAssignmentBase(Schema):
    shift_id: int
    rotation_id: int
    task: str = Field(min_length=1, max_length=100)


class StaffAssignmentCreate(StaffAssignmentBase):
    pass


class StaffAssignmentRead(StaffAssignmentBase):
    id: int


class IncidentBase(Schema):
    flight_id: int
    gate_id: int
    reported_by: int
    category: str = Field(min_length=1, max_length=50)
    severity: int = Field(ge=1, le=5)
    status: str = Field(min_length=1, max_length=20)
    created_at: datetime
    closed_at: datetime | None = None


class IncidentCreate(IncidentBase):
    pass


class IncidentRead(IncidentBase):
    id: int


class ChargeBase(Schema):
    flight_id: int
    kind: str = Field(min_length=1, max_length=50)
    amount_minor: int = Field(ge=0)
    currency: str = Field(min_length=3, max_length=3)


class ChargeCreate(ChargeBase):
    pass


class ChargeRead(ChargeBase):
    id: int


class RoleBase(Schema):
    name: str = Field(min_length=1, max_length=50)


class RoleCreate(RoleBase):
    pass


class RoleRead(RoleBase):
    id: int


class UserBase(Schema):
    email: str
    role_id: int
    airline_id: int
    is_active: bool = False


class UserRead(UserBase):
    id: int


class WeatherObservationBase(Schema):
    airport_id: int
    observed_at: datetime
    wind_kt: int = Field(ge=0)
    visibility_m: int = Field(ge=0)
    ceiling_ft: int = Field(ge=0)
    thunderstorm: bool = False


class WeatherObservationCreate(WeatherObservationBase):
    pass


class WeatherObservationRead(WeatherObservationBase):
    pass
