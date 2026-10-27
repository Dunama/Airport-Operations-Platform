from datetime import datetime

from app.core.schemas import Schema


class InboundEta(Schema):
    flight_id: int
    rotation_id: int | None = None
    airline_id: int
    flight_no: str
    sched_time: datetime
    est_time: datetime | None = None
    # no_signal: no matching aircraft in the bounding box yet
    phase: str  # approaching | final | landed | not_inbound | no_signal
    callsign: str | None = None
    icao24: str | None = None
    distance_km: float | None = None
    ground_speed_kts: int | None = None
    altitude_m: int | None = None
    minutes_to_landing: int | None = None
    predicted_aldt: datetime | None = None
    position_age_s: int | None = None
    delta_vs_sched_min: int | None = None
    delta_vs_est_min: int | None = None


class InboundFeed(Schema):
    status: str  # live | unconfigured | unavailable
    detail: str | None = None
    fetched_at: datetime
    airport_icao: str
    tracked_aircraft: int = 0
    items: list[InboundEta]
