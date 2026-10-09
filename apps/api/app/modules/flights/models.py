from datetime import datetime

from sqlalchemy import DateTime, String

from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Flight(Base):

    __tablename__ = "flights"

    id: Mapped[int] = mapped_column(primary_key=True)

    flight_number: Mapped[str] = mapped_column(String(10), index=True)  # IATA flight number

    airline_iata: Mapped[str] = mapped_column(String(3))   # IATA airline code

    origin: Mapped[str] = mapped_column(String(4))        # ICAO code

    destination: Mapped[str] = mapped_column(String(4))   # ICAO code

    scheduled_departure: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    scheduled_arrival: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    status: Mapped[str] = mapped_column(String(20), default="scheduled")

    # gate assignment is added when you build the gates module
