from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
)
from sqlalchemy.dialects.postgresql import ExcludeConstraint, JSONB, TSTZRANGE
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Airports(Base):
    __tablename__ = "airports"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    iata: Mapped[str] = mapped_column(String(3), unique=True)
    icao: Mapped[str] = mapped_column(String(4), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    timezone: Mapped[str] = mapped_column(String(50))


class Terminals(Base):
    __tablename__ = "terminals"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    airport_id: Mapped[int] = mapped_column(ForeignKey("airports.id"))
    code: Mapped[str] = mapped_column(String(10))


class Gates(Base):
    __tablename__ = "gates"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    terminal_id: Mapped[int] = mapped_column(ForeignKey("terminals.id"))
    code: Mapped[str] = mapped_column(String(10))
    kind: Mapped[str] = mapped_column(String(20))
    max_size: Mapped[str] = mapped_column(String(1))
    intl_capable: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="open")


class Airlines(Base):
    __tablename__ = "airlines"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    iata: Mapped[str] = mapped_column(String(3), unique=True)
    name: Mapped[str] = mapped_column(String(100))


class AircraftTypes(Base):
    __tablename__ = "aircraft_types"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    icao_code: Mapped[str] = mapped_column(String(4), unique=True)
    size: Mapped[str] = mapped_column(String(20))
    seats: Mapped[int] = mapped_column(Integer)
    typical_turn_min: Mapped[int] = mapped_column(Integer)


class Aircraft(Base):
    __tablename__ = "aircraft"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    registration: Mapped[str] = mapped_column(String(20), unique=True)
    airline_id: Mapped[int] = mapped_column(ForeignKey("airlines.id"))
    type_id: Mapped[int] = mapped_column(ForeignKey("aircraft_types.id"))


class Rotations(Base):
    __tablename__ = "rotations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    aircraft_id: Mapped[int] = mapped_column(ForeignKey("aircraft.id"))
    on_block_planned: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    off_block_planned: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Flights(Base):
    __tablename__ = "flights"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    rotation_id: Mapped[int] = mapped_column(ForeignKey("rotations.id"))
    airline_id: Mapped[int] = mapped_column(ForeignKey("airlines.id"))
    origin_id: Mapped[int] = mapped_column(ForeignKey("airports.id"))
    dest_id: Mapped[int] = mapped_column(ForeignKey("airports.id"))
    flight_no: Mapped[str] = mapped_column(String(20))
    direction: Mapped[str] = mapped_column(String(3))
    sched_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    est_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    actual_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(20))
    version: Mapped[int] = mapped_column(Integer, default=1)


class Turnarounds(Base):
    __tablename__ = "turnarounds"

    rotation_id: Mapped[int] = mapped_column(
        ForeignKey("rotations.id"), primary_key=True
    )
    aldt: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    aibt: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    tobt: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    tsat: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    aobt: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    atot: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    predicted_ready: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class OptimizationRuns(Base):
    __tablename__ = "optimization_runs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    requested_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    horizon_start: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    horizon_end: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    n_flights: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20))
    objective: Mapped[float] = mapped_column(Numeric)
    solve_ms: Mapped[int] = mapped_column(Integer)


class GateAssignments(Base):
    __tablename__ = "gate_assignments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    rotation_id: Mapped[int] = mapped_column(ForeignKey("rotations.id"))
    gate_id: Mapped[int] = mapped_column(ForeignKey("gates.id"))
    run_id: Mapped[int] = mapped_column(ForeignKey("optimization_runs.id"))
    during: Mapped[object] = mapped_column(TSTZRANGE)
    source: Mapped[str] = mapped_column(String(20))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    __table_args__ = (
        ExcludeConstraint(
            ("gate_id", "="),
            ("during", "&&"),
            name="exclude_gate_assignments_during",
        ),
    )


class FlightEvents(Base):
    __tablename__ = "flight_events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    flight_id: Mapped[int] = mapped_column(ForeignKey("flights.id"))
    actor_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    type: Mapped[str] = mapped_column(String(50))
    payload: Mapped[dict] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class DelayPredictions(Base):
    __tablename__ = "delay_predictions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    flight_id: Mapped[int] = mapped_column(ForeignKey("flights.id"))
    model_version: Mapped[str] = mapped_column(String(50))
    p_delay_15: Mapped[float] = mapped_column(Float)
    expected_delay_min: Mapped[float] = mapped_column(Float)
    top_factors: Mapped[dict] = mapped_column(JSONB)
    scored_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


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
    checked_in_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    boarded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


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

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    staff_id: Mapped[int] = mapped_column(ForeignKey("staff.id"))
    during: Mapped[object] = mapped_column(TSTZRANGE)

    __table_args__ = (
        ExcludeConstraint(
            ("staff_id", "="),
            ("during", "&&"),
            name="exclude_shifts_during",
        ),
    )


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
    closed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Charges(Base):
    __tablename__ = "charges"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    flight_id: Mapped[int] = mapped_column(ForeignKey("flights.id"))
    kind: Mapped[str] = mapped_column(String(50))
    amount_minor: Mapped[int] = mapped_column(BigInteger)
    currency: Mapped[str] = mapped_column(String(3))


class Roles(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True)


class Users(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password: Mapped[str] = mapped_column(String(255))
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"))
    airline_id: Mapped[int] = mapped_column(ForeignKey("airlines.id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)


class WeatherObservations(Base):
    __tablename__ = "weather_observations"

    airport_id: Mapped[int] = mapped_column(
        ForeignKey("airports.id"), primary_key=True
    )
    observed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), primary_key=True
    )
    wind_kt: Mapped[int] = mapped_column(Integer)
    visibility_m: Mapped[int] = mapped_column(Integer)
    ceiling_ft: Mapped[int] = mapped_column(Integer)
    thunderstorm: Mapped[bool] = mapped_column(Boolean)
