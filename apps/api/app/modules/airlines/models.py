from sqlalchemy import BigInteger, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


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
