"""Thin async client for the OpenSky Network REST API.

Auth is OAuth2 client-credentials: ``OPEN_SKY_CLIENT_ID`` plus the secret in
``OPEN_SKY_API_SECRECT`` (spelling matches the environment variable). Both are
read from settings only. Results are cached briefly so several screens polling
the feed share one upstream call and stay inside OpenSky's credit limits.
"""

import asyncio
import time
from dataclasses import dataclass
from datetime import datetime, timezone

import httpx

from app.core.config import settings

TOKEN_URL = (
    "https://auth.opensky-network.org/auth/realms/opensky-network"
    "/protocol/openid-connect/token"
)
STATES_URL = "https://opensky-network.org/api/states/all"


class OpenSkyNotConfigured(Exception):
    """Credentials are missing from the environment."""


class OpenSkyUnavailable(Exception):
    """OpenSky could not be reached or rejected the request."""


@dataclass(frozen=True)
class AircraftState:
    icao24: str
    callsign: str | None
    latitude: float
    longitude: float
    baro_altitude: float | None
    geo_altitude: float | None
    velocity: float | None  # ground speed, m/s
    true_track: float | None  # degrees clockwise from north
    vertical_rate: float | None
    on_ground: bool
    position_time: datetime | None

    @classmethod
    def from_vector(cls, v: list) -> "AircraftState | None":
        """Parse one entry of the ``states`` array; None when it has no position."""
        if len(v) < 14 or v[5] is None or v[6] is None:
            return None
        callsign = (v[1] or "").strip().upper() or None
        position_time = (
            datetime.fromtimestamp(v[3], tz=timezone.utc) if v[3] else None
        )
        return cls(
            icao24=v[0],
            callsign=callsign,
            longitude=v[5],
            latitude=v[6],
            baro_altitude=v[7],
            geo_altitude=v[13],
            velocity=v[9],
            true_track=v[10],
            vertical_rate=v[11],
            on_ground=bool(v[8]),
            position_time=position_time,
        )


Box = tuple[float, float, float, float]  # lamin, lomin, lamax, lomax


class OpenSkyClient:
    def __init__(
        self,
        *,
        secret: str | None,
        client_id: str | None,
        cache_ttl: float = 30.0,
        timeout: float = 10.0,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._secret = secret
        self._client_id = client_id
        self._cache_ttl = cache_ttl
        self._timeout = timeout
        self._transport = transport
        self._token: str | None = None
        self._token_expiry = 0.0
        self._cache: dict[Box, tuple[float, list[AircraftState]]] = {}
        self._lock = asyncio.Lock()

    @property
    def configured(self) -> bool:
        return bool(self._secret and self._client_id)

    def missing_settings(self) -> list[str]:
        missing = []
        if not self._secret:
            missing.append("OPEN_SKY_API_SECRECT")
        if not self._client_id:
            missing.append("OPEN_SKY_CLIENT_ID")
        return missing

    async def _bearer(self, http: httpx.AsyncClient, *, force: bool = False) -> str:
        if not force and self._token and time.monotonic() < self._token_expiry:
            return self._token
        response = await http.post(
            TOKEN_URL,
            data={
                "grant_type": "client_credentials",
                "client_id": self._client_id,
                "client_secret": self._secret,
            },
        )
        if response.status_code != 200:
            raise OpenSkyUnavailable(
                f"OpenSky rejected the credentials (HTTP {response.status_code})"
            )
        body = response.json()
        self._token = body["access_token"]
        self._token_expiry = time.monotonic() + max(int(body.get("expires_in", 300)) - 30, 30)
        return self._token

    async def states_in_box(self, box: Box) -> list[AircraftState]:
        if not self.configured:
            raise OpenSkyNotConfigured(", ".join(self.missing_settings()))

        async with self._lock:
            cached = self._cache.get(box)
            if cached and time.monotonic() - cached[0] < self._cache_ttl:
                return cached[1]

            lamin, lomin, lamax, lomax = box
            params = {"lamin": lamin, "lomin": lomin, "lamax": lamax, "lomax": lomax}
            try:
                async with httpx.AsyncClient(
                    timeout=self._timeout, transport=self._transport
                ) as http:
                    token = await self._bearer(http)
                    response = await http.get(
                        STATES_URL, params=params, headers={"Authorization": f"Bearer {token}"}
                    )
                    if response.status_code == 401:
                        token = await self._bearer(http, force=True)
                        response = await http.get(
                            STATES_URL,
                            params=params,
                            headers={"Authorization": f"Bearer {token}"},
                        )
            except httpx.HTTPError as exc:
                raise OpenSkyUnavailable("Could not reach OpenSky") from exc

            if response.status_code == 429:
                raise OpenSkyUnavailable("OpenSky rate limit reached")
            if response.status_code != 200:
                raise OpenSkyUnavailable(f"OpenSky returned HTTP {response.status_code}")

            raw = response.json().get("states") or []
            states = [s for s in (AircraftState.from_vector(v) for v in raw) if s]
            self._cache[box] = (time.monotonic(), states)
            return states


_client: OpenSkyClient | None = None


def get_opensky_client() -> OpenSkyClient:
    """FastAPI dependency; one shared client so the cache and token are reused."""
    global _client
    if _client is None:
        _client = OpenSkyClient(
            secret=settings.open_sky_api_secrect,
            client_id=settings.open_sky_client_id,
        )
    return _client
