"""Application services for the flight domain."""

from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crud import CrudService
from app.modules.flights.models import Flights
from app.modules.operations.models import Rotations, Turnarounds


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

    async def create_movement(
        self,
        session: AsyncSession,
        values: dict[str, Any],
    ) -> Flights:
        """Create a flight, materialising a rotation when none is given."""
        payload = dict(values)
        aircraft_id = payload.pop("aircraft_id", None)
        rotation_id = payload.pop("rotation_id", None)

        if rotation_id is None:
            if aircraft_id is None:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Provide a rotation_id or an aircraft_id",
                )
            sched = payload["sched_time"]
            on_block = payload.get("est_time") or sched
            rotation = Rotations(
                aircraft_id=aircraft_id,
                on_block_planned=on_block,
                off_block_planned=on_block,
            )
            session.add(rotation)
            await session.flush()
            session.add(Turnarounds(rotation_id=rotation.id, tobt=on_block))
            await session.flush()
            rotation_id = rotation.id

        payload["rotation_id"] = rotation_id
        flight = self.model(**payload)
        session.add(flight)
        try:
            await session.flush()
            self._log(session, "create", flight)
            await session.commit()
        except IntegrityError as exc:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The record conflicts with an existing record or reference",
            ) from exc
        await session.refresh(flight)
        return flight

    async def update_movement(
        self,
        session: AsyncSession,
        flight_id: int,
        values: dict[str, Any],
    ) -> Flights:
        """Patch a flight and bump its optimistic-concurrency version."""
        flight = await self.get(session, flight_id)
        for field, value in values.items():
            if value is not None:
                setattr(flight, field, value)
        flight.version = (flight.version or 1) + 1
        try:
            self._log(session, "update", flight)
            await session.commit()
        except IntegrityError as exc:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The update conflicts with an existing record or reference",
            ) from exc
        await session.refresh(flight)
        return flight


__all__ = ["CrudService", "FlightService"]
