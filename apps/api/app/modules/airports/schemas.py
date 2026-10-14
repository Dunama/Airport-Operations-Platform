from pydantic import Field

from app.core.schemas import Schema


class AirportBase(Schema):
    iata: str = Field(min_length=3, max_length=3)
    icao: str = Field(min_length=4, max_length=4)
    name: str = Field(min_length=1, max_length=100)
    timezone: str = Field(min_length=1, max_length=50)


class AirportCreate(AirportBase):
    pass


class AirportRead(AirportBase):
    id: int


class TerminalBase(Schema):
    airport_id: int
    code: str = Field(min_length=1, max_length=10)


class TerminalCreate(TerminalBase):
    pass


class TerminalRead(TerminalBase):
    id: int
