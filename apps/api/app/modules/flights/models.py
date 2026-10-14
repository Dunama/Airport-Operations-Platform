from datetime import datetime

from sqlalchemy import BigInteger, CheckConstraint, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Flights(Base):
    __tablename__ = "flights"

    __table_args__ = (
        CheckConstraint(
            "direction IN ('ARR', 'DEP', 'IN', 'OUT')",
            name="ck_flights_direction",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    rotation_id: Mapped[int] = mapped_column(ForeignKey("rotations.id"))
    airline_id: Mapped[int] = mapped_column(ForeignKey("airlines.id"))
    origin_id: Mapped[int] = mapped_column(ForeignKey("airports.id"))
    dest_id: Mapped[int] = mapped_column(ForeignKey("airports.id"))
    flight_no: Mapped[str] = mapped_column(String(20))
    direction: Mapped[str] = mapped_column(String(3))
    sched_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    est_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    actual_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(20))
    version: Mapped[int] = mapped_column(Integer, default=1)


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


from app.modules.airlines.models import Aircraft, AircraftTypes, Airlines
from app.modules.airports.models import Airports, Terminals
from app.modules.gates.models import GateAssignments, Gates, OptimizationRuns
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
    Users,
    WeatherObservations,
)

__all__ = [
    "Aircraft",
    "AircraftTypes",
    "Airlines",
    "Airports",
    "Baggage",
    "BaggageEvents",
    "Bookings",
    "Charges",
    "DelayPredictions",
    "FlightEvents",
    "Flights",
    "GateAssignments",
    "Gates",
    "Incidents",
    "OptimizationRuns",
    "Passengers",
    "Roles",
    "Rotations",
    "Shifts",
    "Staff",
    "StaffAssignments",
    "Terminals",
    "Turnarounds",
    "Users",
    "WeatherObservations",
]
