from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, Numeric, SmallInteger, String
from sqlalchemy.dialects.postgresql import ExcludeConstraint, JSONB, TSTZRANGE
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.modules.auth.models import Role as Roles, User as Users


class Rotations(Base):
    __tablename__ = "rotations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    aircraft_id: Mapped[int] = mapped_column(ForeignKey("aircraft.id"))
    on_block_planned: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    off_block_planned: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Turnarounds(Base):
    __tablename__ = "turnarounds"

    rotation_id: Mapped[int] = mapped_column(ForeignKey("rotations.id"), primary_key=True)
    aldt: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    aibt: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    tobt: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    tsat: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    aobt: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    atot: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    predicted_ready: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Passengers(Base):
    __tablename__ = "passengers"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    nationality: Mapped[str] = mapped_column(String(50))


class Bookings(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    flight_id: Mapped[int] = mapped_column(ForeignKey("flights.id"))
    passenger_id: Mapped[int] = mapped_column(ForeignKey("passengers.id"))
    seat: Mapped[str] = mapped_column(String(10))
    checked_in_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    boarded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Baggage(Base):
    __tablename__ = "baggage"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    booking_id: Mapped[int] = mapped_column(ForeignKey("bookings.id"))
    tag: Mapped[str] = mapped_column(String(50), unique=True)
    weight_kg: Mapped[float] = mapped_column(Numeric)


class BaggageEvents(Base):
    __tablename__ = "baggage_events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    baggage_id: Mapped[int] = mapped_column(ForeignKey("baggage.id"))
    location: Mapped[str] = mapped_column(String(100))
    scanned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Staff(Base):
    __tablename__ = "staff"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(100))
    skill: Mapped[str] = mapped_column(String(50))


class Shifts(Base):
    __tablename__ = "shifts"

    __table_args__ = (
        ExcludeConstraint(
            ("staff_id", "="),
            ("during", "&&"),
            name="exclude_shifts_during",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    staff_id: Mapped[int] = mapped_column(ForeignKey("staff.id"))
    during: Mapped[object] = mapped_column(TSTZRANGE)


class StaffAssignments(Base):
    __tablename__ = "staff_assignments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    shift_id: Mapped[int] = mapped_column(ForeignKey("shifts.id"))
    rotation_id: Mapped[int] = mapped_column(ForeignKey("rotations.id"))
    task: Mapped[str] = mapped_column(String(100))


class Incidents(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    flight_id: Mapped[int] = mapped_column(ForeignKey("flights.id"))
    gate_id: Mapped[int] = mapped_column(ForeignKey("gates.id"))
    reported_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    category: Mapped[str] = mapped_column(String(50))
    severity: Mapped[int] = mapped_column(SmallInteger)
    status: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Charges(Base):
    __tablename__ = "charges"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    flight_id: Mapped[int] = mapped_column(ForeignKey("flights.id"))
    kind: Mapped[str] = mapped_column(String(50))
    amount_minor: Mapped[int] = mapped_column(BigInteger)
    currency: Mapped[str] = mapped_column(String(3))


class WeatherObservations(Base):
    __tablename__ = "weather_observations"

    airport_id: Mapped[int] = mapped_column(ForeignKey("airports.id"), primary_key=True)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
    wind_kt: Mapped[int] = mapped_column(Integer)
    visibility_m: Mapped[int] = mapped_column(Integer)
    ceiling_ft: Mapped[int] = mapped_column(Integer)
    thunderstorm: Mapped[bool] = mapped_column(Boolean, default=False)
