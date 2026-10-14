from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import Field

from app.core.schemas import Schema


class RotationBase(Schema):
    aircraft_id: int
    on_block_planned: datetime
    off_block_planned: datetime


class RotationCreate(RotationBase):
    pass


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


class TurnaroundCreate(TurnaroundBase):
    rotation_id: int


class TurnaroundRead(TurnaroundBase):
    rotation_id: int


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
