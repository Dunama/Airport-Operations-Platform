from pydantic import Field

from app.core.schemas import Schema


class AirlineBase(Schema):
    iata: str = Field(min_length=2, max_length=3)
    name: str = Field(min_length=1, max_length=100)


class AirlineCreate(AirlineBase):
    pass


class AirlineUpdate(Schema):
    iata: str | None = Field(default=None, min_length=2, max_length=3)
    name: str | None = Field(default=None, min_length=1, max_length=100)


class AirlineRead(AirlineBase):
    id: int


class AircraftTypeBase(Schema):
    icao_code: str = Field(min_length=1, max_length=4)
    size: str = Field(min_length=1, max_length=20)
    seats: int = Field(gt=0)
    typical_turn_min: int = Field(gt=0)


class AircraftTypeCreate(AircraftTypeBase):
    pass


class AircraftTypeUpdate(Schema):
    icao_code: str | None = Field(default=None, min_length=1, max_length=4)
    size: str | None = Field(default=None, min_length=1, max_length=20)
    seats: int | None = Field(default=None, gt=0)
    typical_turn_min: int | None = Field(default=None, gt=0)


class AircraftTypeRead(AircraftTypeBase):
    id: int


class AircraftBase(Schema):
    registration: str = Field(min_length=1, max_length=20)
    airline_id: int
    type_id: int


class AircraftCreate(AircraftBase):
    pass


class AircraftUpdate(Schema):
    registration: str | None = Field(default=None, min_length=1, max_length=20)
    airline_id: int | None = None
    type_id: int | None = None


class AircraftRead(AircraftBase):
    id: int
