from datetime import datetime
from decimal import Decimal

from pydantic import Field

from app.core.schemas import Schema


class RotationBase(Schema):
    aircraft_id: int
    on_block_planned: datetime
    off_block_planned: datetime


class RotationCreate(RotationBase):
    pass


class RotationUpdate(Schema):
    aircraft_id: int | None = None
    on_block_planned: datetime | None = None
    off_block_planned: datetime | None = None


class RotationRead(RotationBase):
    id: int


class TurnaroundBase(Schema):
    aldt: datetime | None = None
    aibt: datetime | None = None
    tobt: datetime | None = None
    tsat: datetime | None = None
    aobt: datetime | None = None
    atot: datetime | None = None
    predicted_ready: datetime | None = None
    predicted_aldt: datetime | None = None


class TurnaroundCreate(TurnaroundBase):
    rotation_id: int


class TurnaroundUpdate(TurnaroundBase):
    pass


class TurnaroundRead(TurnaroundBase):
    rotation_id: int


class PassengerBase(Schema):
    name: str = Field(min_length=1, max_length=100)
    nationality: str = Field(min_length=1, max_length=50)


class PassengerCreate(PassengerBase):
    pass


class PassengerUpdate(Schema):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    nationality: str | None = Field(default=None, min_length=1, max_length=50)


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


class BookingUpdate(Schema):
    flight_id: int | None = None
    passenger_id: int | None = None
    seat: str | None = Field(default=None, min_length=1, max_length=10)
    checked_in_at: datetime | None = None
    boarded_at: datetime | None = None


class BookingRead(BookingBase):
    id: int


class BaggageBase(Schema):
    booking_id: int
    tag: str = Field(min_length=1, max_length=50)
    weight_kg: Decimal = Field(gt=0)


class BaggageCreate(BaggageBase):
    pass


class BaggageUpdate(Schema):
    booking_id: int | None = None
    tag: str | None = Field(default=None, min_length=1, max_length=50)
    weight_kg: Decimal | None = Field(default=None, gt=0)


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


class StaffUpdate(Schema):
    user_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=100)
    skill: str | None = Field(default=None, min_length=1, max_length=50)


class StaffRead(StaffBase):
    id: int


class ShiftBase(Schema):
    staff_id: int


class ShiftCreate(ShiftBase):
    start: datetime
    end: datetime


class ShiftUpdate(Schema):
    staff_id: int | None = None
    start: datetime | None = None
    end: datetime | None = None


class ShiftRead(ShiftBase):
    id: int
    start: datetime
    end: datetime


class StaffAssignmentBase(Schema):
    shift_id: int
    rotation_id: int
    task: str = Field(min_length=1, max_length=100)


class StaffAssignmentCreate(StaffAssignmentBase):
    pass


class StaffAssignmentUpdate(Schema):
    shift_id: int | None = None
    rotation_id: int | None = None
    task: str | None = Field(default=None, min_length=1, max_length=100)


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


class IncidentUpdate(Schema):
    category: str | None = Field(default=None, min_length=1, max_length=50)
    severity: int | None = Field(default=None, ge=1, le=5)
    status: str | None = Field(default=None, min_length=1, max_length=20)
    closed_at: datetime | None = None


class IncidentRead(IncidentBase):
    id: int


class IncidentReport(Schema):
    flight_id: int
    gate_id: int
    category: str = Field(min_length=1, max_length=50)
    severity: int = Field(ge=1, le=5)
    status: str = Field(default="open", min_length=1, max_length=20)


class ChargeBase(Schema):
    flight_id: int
    kind: str = Field(min_length=1, max_length=50)
    amount_minor: int = Field(ge=0)
    currency: str = Field(min_length=3, max_length=3)


class ChargeCreate(ChargeBase):
    pass


class ChargeUpdate(Schema):
    flight_id: int | None = None
    kind: str | None = Field(default=None, min_length=1, max_length=50)
    amount_minor: int | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)


class ChargeRead(ChargeBase):
    id: int


class RoleBase(Schema):
    name: str = Field(min_length=1, max_length=50)


class RoleCreate(RoleBase):
    pass


class RoleUpdate(Schema):
    name: str | None = Field(default=None, min_length=1, max_length=50)


class RoleRead(RoleBase):
    id: int


class UserBase(Schema):
    email: str
    role_id: int
    airline_id: int
    is_active: bool = False


class UserRead(UserBase):
    id: int


class UserUpdate(Schema):
    role_id: int | None = None
    airline_id: int | None = None
    is_active: bool | None = None


class ShiftDetailRead(Schema):
    id: int
    staff_id: int
    start: datetime
    end: datetime


class BaggageDetailRead(Schema):
    id: int
    booking_id: int
    flight_id: int
    flight_no: str | None = None
    passenger_name: str | None = None
    tag: str
    weight_kg: Decimal
    last_location: str | None = None
    last_scanned_at: datetime | None = None
