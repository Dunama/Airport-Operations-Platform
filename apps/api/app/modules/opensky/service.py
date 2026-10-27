"""Inbound ETA feed: match the arrivals board to live ADS-B and derive ALDT."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.modules.flights.models import Flights
from app.modules.opensky.client import (
    AircraftState,
    OpenSkyClient,
    OpenSkyNotConfigured,
    OpenSkyUnavailable,
)
from app.modules.opensky.eta import bounding_box, callsign_candidates, estimate_landing
from app.modules.opensky.schemas import InboundEta, InboundFeed
from app.modules.operations.models import Turnarounds

CLOSED_STATUSES = ("arrived", "landed", "departed", "cancelled")
LOOKBACK = timedelta(hours=3)
LOOKAHEAD = timedelta(hours=8)
# Don't rewrite the stored prediction for sub-minute jitter.
WRITE_THRESHOLD = timedelta(seconds=45)


def _minutes(delta: timedelta) -> int:
    return round(delta.total_seconds() / 60)


async def inbound_feed(
    session: AsyncSession,
    client: OpenSkyClient,
    *,
    airline_id: int | None = None,
    now: datetime | None = None,
) -> InboundFeed:
    now = now or datetime.now(timezone.utc)

    query = (
        select(Flights, Turnarounds)
        .outerjoin(Turnarounds, Turnarounds.rotation_id == Flights.rotation_id)
        .where(
            Flights.direction.in_(("ARR", "IN")),
            Flights.actual_time.is_(None),
            Flights.status.not_in(CLOSED_STATUSES),
            Flights.sched_time >= now - LOOKBACK,
            Flights.sched_time <= now + LOOKAHEAD,
        )
        .order_by(Flights.sched_time)
    )
    if airline_id is not None:
        query = query.where(Flights.airline_id == airline_id)
    rows = (await session.execute(query)).all()

    status, detail = "live", None
    states: list[AircraftState] = []
    try:
        states = await client.states_in_box(
            bounding_box(
                settings.airport_lat, settings.airport_lon, settings.airport_bbox_radius_km
            )
        )
    except OpenSkyNotConfigured as exc:
        status, detail = "unconfigured", f"Set {exc} in the API environment"
    except OpenSkyUnavailable as exc:
        status, detail = "unavailable", str(exc)

    by_callsign = {s.callsign: s for s in states if s.callsign}

    items: list[InboundEta] = []
    changed = False
    for flight, turnaround in rows:
        reference = flight.est_time or flight.sched_time
        item = InboundEta(
            flight_id=flight.id,
            rotation_id=flight.rotation_id,
            airline_id=flight.airline_id,
            flight_no=flight.flight_no,
            sched_time=flight.sched_time,
            est_time=flight.est_time,
            phase="no_signal",
        )
        matched = next(
            (
                (cs, by_callsign[cs])
                for cs in sorted(callsign_candidates(flight.flight_no))
                if cs in by_callsign
            ),
            None,
        )
        if matched:
            callsign, state = matched
            est = estimate_landing(state, settings.airport_lat, settings.airport_lon, now)
            item.phase = est.phase
            item.callsign = callsign
            item.icao24 = state.icao24
            item.distance_km = est.distance_km
            item.ground_speed_kts = est.ground_speed_kts
            item.altitude_m = est.altitude_m
            item.position_age_s = est.position_age_s
            if est.predicted_aldt is not None:
                item.predicted_aldt = est.predicted_aldt
                item.minutes_to_landing = max(round(est.seconds_to_landing / 60), 0)
                item.delta_vs_sched_min = _minutes(est.predicted_aldt - flight.sched_time)
                item.delta_vs_est_min = _minutes(est.predicted_aldt - reference)

                # Feed the A-CDM turnaround: ALDT prediction until the real one is logged.
                if (
                    turnaround is not None
                    and turnaround.aldt is None
                    and (
                        turnaround.predicted_aldt is None
                        or abs(turnaround.predicted_aldt - est.predicted_aldt)
                        > WRITE_THRESHOLD
                    )
                ):
                    turnaround.predicted_aldt = est.predicted_aldt
                    changed = True
        items.append(item)

    if changed:
        await session.commit()

    return InboundFeed(
        status=status,
        detail=detail,
        fetched_at=now,
        airport_icao=settings.airport_icao,
        tracked_aircraft=len(states),
        items=items,
    )
