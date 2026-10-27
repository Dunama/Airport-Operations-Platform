from datetime import datetime, timedelta, timezone

import httpx
import pytest

from app.main import app
from app.modules.opensky.client import (
    AircraftState,
    OpenSkyClient,
    OpenSkyNotConfigured,
    OpenSkyUnavailable,
    get_opensky_client,
)
from app.modules.opensky.eta import (
    bounding_box,
    callsign_candidates,
    estimate_landing,
    haversine_km,
)

LAT, LON = 9.0068, 7.2632
NOW = datetime(2026, 10, 27, 12, 0, tzinfo=timezone.utc)


def state(**overrides) -> AircraftState:
    base = dict(
        icao24="a1b2c3",
        callsign="DAL802",
        latitude=LAT - 100 / 111.19,  # ~100 km due south
        longitude=LON,
        baro_altitude=6000.0,
        geo_altitude=6100.0,
        velocity=200.0,
        true_track=0.0,  # heading north, towards the airport
        vertical_rate=-8.0,
        on_ground=False,
        position_time=NOW,
    )
    base.update(overrides)
    return AircraftState(**base)


def test_haversine_one_degree_latitude():
    assert haversine_km(0, 0, 1, 0) == pytest.approx(111.19, abs=0.1)


def test_bounding_box_contains_airport_and_is_symmetric():
    lamin, lomin, lamax, lomax = bounding_box(LAT, LON, 150)
    assert lamin < LAT < lamax and lomin < LON < lomax
    assert (lamax - LAT) == pytest.approx(LAT - lamin, abs=1e-3)


def test_inbound_eta_blends_cruise_and_approach_speed():
    est = estimate_landing(state(), LAT, LON, NOW)
    assert est.phase == "approaching"
    assert est.distance_km == pytest.approx(100, abs=0.5)
    # (100-18.5) km at 200 m/s + 18.5 km at the 72 m/s approach speed
    expected = 81_500 / 200 + 18_500 / 72
    assert est.seconds_to_landing == pytest.approx(expected, abs=5)
    assert abs((est.predicted_aldt - NOW).total_seconds() - est.seconds_to_landing) < 1
    assert est.ground_speed_kts == 389


def test_stale_position_shortens_remaining_time():
    fresh = estimate_landing(state(), LAT, LON, NOW)
    stale = estimate_landing(state(position_time=NOW - timedelta(seconds=60)), LAT, LON, NOW)
    assert stale.predicted_aldt == fresh.predicted_aldt - timedelta(seconds=60)
    assert stale.seconds_to_landing == fresh.seconds_to_landing - 60


def test_short_final_phase():
    est = estimate_landing(state(latitude=LAT - 10 / 111.19, velocity=75.0), LAT, LON, NOW)
    assert est.phase == "final"
    assert est.seconds_to_landing == pytest.approx(10_000 / 72, abs=5)


def test_aircraft_flying_away_is_not_inbound():
    est = estimate_landing(state(true_track=180.0), LAT, LON, NOW)
    assert est.phase == "not_inbound"
    assert est.predicted_aldt is None


def test_on_ground_at_airport_is_landed_elsewhere_not_inbound():
    assert estimate_landing(state(latitude=LAT, on_ground=True), LAT, LON, NOW).phase == "landed"
    assert estimate_landing(state(on_ground=True), LAT, LON, NOW).phase == "not_inbound"


def test_missing_velocity_falls_back_instead_of_failing():
    est = estimate_landing(state(velocity=None), LAT, LON, NOW)
    assert est.predicted_aldt is not None and est.ground_speed_kts is None


def test_callsign_candidates_map_iata_to_icao():
    assert {"DL802", "DAL802"} <= callsign_candidates("DL802")
    assert "DAL007" in callsign_candidates("DL7")
    assert "UNKNOWN1" not in callsign_candidates("DL802")


VECTOR = [
    "a1b2c3", "DAL802  ", "United States", 1_793_000_000, 1_793_000_001, 7.3, 8.5,
    6000.0, False, 200.0, 5.0, -8.0, None, 6100.0, "1000", False, 0,
]


def _client(handler, **kwargs) -> OpenSkyClient:
    return OpenSkyClient(
        secret=kwargs.pop("secret", "s3cret"),
        client_id=kwargs.pop("client_id", "cid"),
        transport=httpx.MockTransport(handler),
        **kwargs,
    )


async def test_client_authenticates_then_fetches_and_caches():
    calls = {"token": 0, "states": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.host == "auth.opensky-network.org":
            calls["token"] += 1
            body = request.content.decode()
            assert "client_id=cid" in body and "client_secret=s3cret" in body
            return httpx.Response(200, json={"access_token": "tok", "expires_in": 1800})
        calls["states"] += 1
        assert request.headers["authorization"] == "Bearer tok"
        assert request.url.params["lamin"] == "1.0" and request.url.params["lomax"] == "4.0"
        return httpx.Response(200, json={"time": 1, "states": [VECTOR, [*VECTOR[:5], None, None, *VECTOR[7:]]]})

    client = _client(handler)
    box = (1.0, 2.0, 3.0, 4.0)
    states = await client.states_in_box(box)
    assert [s.callsign for s in states] == ["DAL802"]  # position-less vector dropped
    await client.states_in_box(box)
    assert calls == {"token": 1, "states": 1}


async def test_client_requires_both_credentials():
    client = _client(lambda r: httpx.Response(500), secret=None)
    assert client.missing_settings() == ["OPEN_SKY_API_SECRECT"]
    with pytest.raises(OpenSkyNotConfigured):
        await client.states_in_box((0, 0, 1, 1))


async def test_client_reports_bad_credentials_and_rate_limit():
    bad = _client(lambda r: httpx.Response(401, json={}))
    with pytest.raises(OpenSkyUnavailable):
        await bad.states_in_box((0, 0, 1, 1))

    def limited(request: httpx.Request) -> httpx.Response:
        if request.url.host == "auth.opensky-network.org":
            return httpx.Response(200, json={"access_token": "t", "expires_in": 600})
        return httpx.Response(429)

    with pytest.raises(OpenSkyUnavailable, match="rate limit"):
        await _client(limited).states_in_box((0, 0, 1, 1))


async def test_inbound_endpoint_degrades_when_unconfigured(client):
    app.dependency_overrides[get_opensky_client] = lambda: OpenSkyClient(
        secret=None, client_id=None
    )
    try:
        response = await client.get("/opensky/inbound")
    finally:
        app.dependency_overrides.pop(get_opensky_client, None)
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "unconfigured"
    assert "OPEN_SKY_API_SECRECT" in body["detail"]
    assert body["items"] == []


async def test_feed_matches_flight_and_writes_turnaround_prediction(client):
    """DL802 on the board + DAL802 in the box => minutes to landing and ALDT written."""
    from app.core.config import settings
    from app.modules.opensky.service import inbound_feed

    # Seed the minimum graph with raw ORM through the test client's session override.
    from app.core.db import get_session

    session_factory = app.dependency_overrides[get_session]
    from app.modules.airlines.models import Aircraft, AircraftTypes, Airlines
    from app.modules.airports.models import Airports
    from app.modules.flights.models import Flights
    from app.modules.operations.models import Rotations, Turnarounds

    now = datetime.now(timezone.utc)
    async for session in session_factory():
        airline = Airlines(iata="DL", name="Delta")
        a_type = AircraftTypes(icao_code="B738", size="D", seats=160, typical_turn_min=45)
        orig = Airports(iata="ATL", icao="KATL", name="Atlanta", timezone="UTC")
        dest = Airports(iata="ABV", icao="DNAA", name="Abuja", timezone="UTC")
        session.add_all([airline, a_type, orig, dest])
        await session.flush()
        plane = Aircraft(registration="N802DL", airline_id=airline.id, type_id=a_type.id)
        session.add(plane)
        await session.flush()
        rotation = Rotations(
            aircraft_id=plane.id,
            on_block_planned=now + timedelta(minutes=30),
            off_block_planned=now + timedelta(minutes=90),
        )
        session.add(rotation)
        await session.flush()
        session.add(Turnarounds(rotation_id=rotation.id, tobt=now + timedelta(minutes=80)))
        session.add(
            Flights(
                rotation_id=rotation.id, airline_id=airline.id, origin_id=orig.id,
                dest_id=dest.id, flight_no="DL802", direction="ARR",
                sched_time=now + timedelta(minutes=20), status="on_time", version=1,
            )
        )
        await session.commit()

        vector = [
            "a1b2c3", "DAL802", "US", int(now.timestamp()), int(now.timestamp()),
            settings.airport_lon, settings.airport_lat - 100 / 111.19, 6000.0, False,
            200.0, 0.0, -8.0, None, 6100.0, None, False, 0,
        ]

        def handler(request: httpx.Request) -> httpx.Response:
            if request.url.host == "auth.opensky-network.org":
                return httpx.Response(200, json={"access_token": "t", "expires_in": 600})
            return httpx.Response(200, json={"states": [vector]})

        opensky = _client(handler)
        feed = await inbound_feed(session, opensky, now=now)
        assert feed.status == "live" and feed.tracked_aircraft == 1
        (item,) = feed.items
        assert item.flight_no == "DL802" and item.callsign == "DAL802"
        assert item.phase == "approaching" and item.minutes_to_landing == 11
        assert item.delta_vs_sched_min == -9  # lands ~11 min out vs 20 min scheduled

        stored = await session.get(Turnarounds, rotation.id)
        assert stored.predicted_aldt is not None and stored.aldt is None
        assert abs((stored.predicted_aldt - item.predicted_aldt).total_seconds()) < 1
        break
