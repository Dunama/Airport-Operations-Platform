from datetime import datetime

from pydantic import Field

from app.core.schemas import Schema


class AirportBase(Schema):
    iata: str = Field(min_length=3, max_length=3)
    icao: str = Field(min_length=4, max_length=4)
    name: str = Field(min_length=1, max_length=100)
    timezone: str = Field(min_length=1, max_length=50)


class AirportCreate(AirportBase):
    pass


class AirportUpdate(Schema):
    iata: str | None = Field(default=None, min_length=3, max_length=3)
    icao: str | None = Field(default=None, min_length=4, max_length=4)
    name: str | None = Field(default=None, min_length=1, max_length=100)
    timezone: str | None = Field(default=None, min_length=1, max_length=50)


class AirportRead(AirportBase):
    id: int


class TerminalBase(Schema):
    airport_id: int
    code: str = Field(min_length=1, max_length=10)


class TerminalCreate(TerminalBase):
    pass


class TerminalUpdate(Schema):
    airport_id: int | None = None
    code: str | None = Field(default=None, min_length=1, max_length=10)


class TerminalRead(TerminalBase):
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
