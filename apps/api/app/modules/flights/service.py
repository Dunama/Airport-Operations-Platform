"""Application services for the flight domain."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crud import CrudService
from app.modules.flights.models import Flights


class FlightService(CrudService[Flights]):
    """Application service for flight records."""

    async def list_for_airline(
        self,
        session: AsyncSession,
        airline_id: int,
        *,
        offset: int = 0,
        limit: int = 100,
    ) -> list[Flights]:
        result = await session.scalars(
            select(self.model)
            .where(self.model.airline_id == airline_id)
            .offset(offset)
            .limit(limit)
        )
        return list(result.all())

__all__ = ["CrudService", "FlightService"]
