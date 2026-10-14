from sqlalchemy import BigInteger, ForeignKey, String
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
