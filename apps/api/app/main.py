from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

from app.core.config import settings

from app.health import router as health_router
from app.modules.airports.router import router as airports_router
from app.modules.flights.router import router as flights_router
from app.modules.auth.router import router as auth_router

app = FastAPI(title="Airport Management System")

app.add_middleware(

    CORSMiddleware,

    allow_origins=settings.cors_origins,   # add your Vercel domain in production

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)

app.include_router(health_router)
app.include_router(airports_router, prefix="/airports", tags=["airports"])
app.include_router(flights_router, prefix="/flights", tags=["flights"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])