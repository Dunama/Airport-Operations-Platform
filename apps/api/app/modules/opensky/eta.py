"""Landing-time estimation from an ADS-B state vector. Pure functions, no I/O."""

import math
import re
from dataclasses import dataclass
from datetime import datetime, timedelta

from app.modules.opensky.client import AircraftState, Box

EARTH_RADIUS_KM = 6371.0088
MS_TO_KT = 1.943844

FINAL_KM = 18.5  # last ~10 nm flown at approach speed
APPROACH_SPEED_MS = 72.0  # ~140 kt
MIN_SPEED_MS = 60.0
MAX_CRUISE_SPEED_MS = 280.0  # clamp: speeds above this are not flown in the terminal area
FALLBACK_SPEED_MS = 180.0  # used when the transponder reports no velocity
LANDED_RADIUS_KM = 5.0
HEADING_CHECK_KM = 30.0  # inside this, pattern flying legitimately points anywhere
MAX_HEADING_ERROR_DEG = 90.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = p2 - p1
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def bearing_deg(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dlmb = math.radians(lon2 - lon1)
    y = math.sin(dlmb) * math.cos(p2)
    x = math.cos(p1) * math.sin(p2) - math.sin(p1) * math.cos(p2) * math.cos(dlmb)
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def angle_diff_deg(a: float, b: float) -> float:
    return abs((a - b + 180) % 360 - 180)


def bounding_box(lat: float, lon: float, radius_km: float) -> Box:
    """(lamin, lomin, lamax, lomax) around a point, as /states/all expects."""
    dlat = math.degrees(radius_km / EARTH_RADIUS_KM)
    dlon = math.degrees(radius_km / (EARTH_RADIUS_KM * max(math.cos(math.radians(lat)), 0.01)))
    return (
        round(max(lat - dlat, -90.0), 4),
        round(max(lon - dlon, -180.0), 4),
        round(min(lat + dlat, 90.0), 4),
        round(min(lon + dlon, 180.0), 4),
    )


@dataclass(frozen=True)
class EtaEstimate:
    phase: str  # approaching | final | landed | not_inbound
    distance_km: float
    ground_speed_kts: float | None
    altitude_m: float | None
    seconds_to_landing: float | None
    predicted_aldt: datetime | None
    position_age_s: float | None


def estimate_landing(
    state: AircraftState, airport_lat: float, airport_lon: float, now: datetime
) -> EtaEstimate:
    distance = haversine_km(state.latitude, state.longitude, airport_lat, airport_lon)
    altitude = state.geo_altitude if state.geo_altitude is not None else state.baro_altitude
    speed_kt = state.velocity * MS_TO_KT if state.velocity is not None else None
    age = (now - state.position_time).total_seconds() if state.position_time else None

    def result(phase: str, seconds: float | None = None) -> EtaEstimate:
        predicted = None
        if seconds is not None:
            fix_time = state.position_time or now
            predicted = fix_time + timedelta(seconds=seconds)
        return EtaEstimate(
            phase=phase,
            distance_km=round(distance, 1),
            ground_speed_kts=round(speed_kt) if speed_kt is not None else None,
            altitude_m=round(altitude) if altitude is not None else None,
            seconds_to_landing=(
                round((predicted - now).total_seconds()) if predicted is not None else None
            ),
            predicted_aldt=predicted,
            position_age_s=round(age) if age is not None else None,
        )

    if state.on_ground:
        return result("landed" if distance <= LANDED_RADIUS_KM else "not_inbound")

    if (
        distance > HEADING_CHECK_KM
        and state.true_track is not None
        and (state.velocity or 0) > 40
    ):
        to_airport = bearing_deg(state.latitude, state.longitude, airport_lat, airport_lon)
        if angle_diff_deg(state.true_track, to_airport) > MAX_HEADING_ERROR_DEG:
            return result("not_inbound")

    v = state.velocity if state.velocity else FALLBACK_SPEED_MS
    cruise_v = min(max(v, MIN_SPEED_MS), MAX_CRUISE_SPEED_MS)
    final_v = min(max(v, MIN_SPEED_MS), APPROACH_SPEED_MS)

    final_km = min(distance, FINAL_KM)
    far_km = max(distance - FINAL_KM, 0.0)
    seconds = far_km * 1000 / cruise_v + final_km * 1000 / final_v

    return result("final" if distance <= FINAL_KM else "approaching", seconds)


# --- flight number -> radio callsign -----------------------------------------

# IATA -> ICAO airline designators. ATC callsigns use the ICAO form
# (Delta 802 files as DAL802), flight numbers on the board use IATA (DL802).
IATA_TO_ICAO = {
    "DL": "DAL", "AA": "AAL", "UA": "UAL", "BA": "BAW", "LH": "DLH", "AF": "AFR",
    "KL": "KLM", "EK": "UAE", "QR": "QTR", "EY": "ETD", "TK": "THY", "ET": "ETH",
    "KQ": "KQA", "SA": "SAA", "MS": "MSR", "RJ": "RJA", "WB": "RWD", "AT": "RAM",
    "SV": "SVA", "LX": "SWR", "IB": "IBE", "TP": "TAP", "AC": "ACA", "VS": "VIR",
    "QF": "QFA", "SQ": "SIA", "CX": "CPA", "AI": "AIC", "EI": "EIN", "SN": "BEL",
    "OS": "AUA", "AZ": "ITY", "W3": "ARA", "P4": "APK", "VK": "VKG", "OJ": "OLA",
    "HF": "AWK", "UJ": "LMU", "FZ": "FDB", "G9": "ABY", "PC": "PGT", "ID": "BTK",
}

_FLIGHT_NO = re.compile(r"^([A-Z0-9]{2})\s*0*(\d{1,4}[A-Z]?)$")


def callsign_candidates(flight_no: str) -> set[str]:
    """Callsigns an airline could plausibly use for this flight number."""
    match = _FLIGHT_NO.match(flight_no.strip().upper())
    if not match:
        return {flight_no.strip().upper()}
    iata, number = match.groups()
    candidates = {f"{iata}{number}", f"{iata}{number.zfill(3)}"}
    icao = IATA_TO_ICAO.get(iata)
    if icao:
        candidates |= {f"{icao}{number}", f"{icao}{number.zfill(3)}"}
    return candidates
