from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

from app.health import router as health_router

app = FastAPI(title="Airport Management System")

app.add_middleware(

    CORSMiddleware,

    allow_origins=settings.cors_origins,   # add your Vercel domain in production

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)

app.include_router(health_router)

# include module routers here as you build them:

# app.include_router(flights_router, prefix="/flights", tags=["flights"])
