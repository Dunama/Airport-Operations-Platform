from fastapi import APIRouter

router = APIRouter()


@router.get("/health")

def health() -> dict[str, str]:

    # Deliberately no database call: your uptime monitor pings this to keep

    # Render awake, and touching Neon every few minutes would burn the free

    # 100 CU-hours/month compute allowance.

    return {"status": "ok",
            "message": "API is healthy and ready to serve requests."
            }
