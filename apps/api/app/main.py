from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request

from app.core.activity_context import current_actor_id
from app.core.config import settings
from app.modules.auth.service import decode_token

from app.health import router as health_router
from app.modules.activity.router import router as activity_router
from app.modules.airports.router import (
    router as airports_router,
    terminal_router as terminals_router,
    weather_router as weather_router,
)
from app.modules.flights.router import (
    delay_prediction_router,
    event_router as flight_event_router,
    router as flights_router,
)
from app.modules.auth.router import router as auth_router
from app.modules.airlines.router import (
    aircraft_router,
    aircraft_type_router,
    router as airlines_router,
)
from app.modules.gates.router import (
    gate_assignment_router,
    optimization_run_router,
    router as gates_router,
)
from app.modules.opensky.router import router as opensky_router
from app.modules.operations.router import router as operations_router

app = FastAPI(title="Airport Management System")

app.add_middleware(

    CORSMiddleware,

    allow_origins=settings.cors_origins,   # add your Vercel domain in production

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)


@app.middleware("http")
async def actor_context_middleware(request: Request, call_next):
    """Decode the bearer token (if any) so CrudService can attribute activity log entries."""
    actor_id = None
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        try:
            payload = decode_token(auth_header.split(" ", 1)[1])
            actor_id = int(payload["sub"])
        except Exception:
            actor_id = None
    token = current_actor_id.set(actor_id)
    try:
        return await call_next(request)
    finally:
        current_actor_id.reset(token)


app.include_router(health_router)
app.include_router(activity_router, prefix="/activity", tags=["activity"])
app.include_router(airports_router, prefix="/airports", tags=["airports"])
app.include_router(flights_router, prefix="/flights", tags=["flights"])
app.include_router(
    flight_event_router, prefix="/flights/events", tags=["flight-events"]
)
app.include_router(
    delay_prediction_router,
    prefix="/flights/delay-predictions",
    tags=["delay-predictions"],
)
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(airlines_router, prefix="/airlines", tags=["airlines"])
app.include_router(aircraft_router, prefix="/aircraft", tags=["aircraft"])
app.include_router(
    aircraft_type_router, prefix="/aircraft-types", tags=["aircraft-types"]
)
app.include_router(terminals_router, prefix="/terminals", tags=["terminals"])
app.include_router(weather_router, prefix="/airports/weather", tags=["weather"])
app.include_router(gates_router, prefix="/gates", tags=["gates"])
app.include_router(
    gate_assignment_router, prefix="/gate-assignments", tags=["gate-assignments"]
)
app.include_router(
    optimization_run_router,
    prefix="/optimization-runs",
    tags=["optimization-runs"],
)
app.include_router(operations_router, prefix="/operations", tags=["operations"])
app.include_router(opensky_router, prefix="/opensky", tags=["opensky"])
