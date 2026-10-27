from datetime import datetime, timezone
from typing import Any, Generic, TypeVar

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.core.activity_context import current_actor_id
from app.modules.activity.models import ActivityLog


ModelT = TypeVar("ModelT", bound=DeclarativeBase)

_LABEL_FIELDS = (
    "flight_no",
    "code",
    "name",
    "registration",
    "iata",
    "icao_code",
    "email",
    "tag",
    "task",
)


def _describe(item: Any) -> str:
    for field in _LABEL_FIELDS:
        value = getattr(item, field, None)
        if value:
            return str(value)
    identifier = getattr(item, "id", None)
    if identifier is None:
        identifier = getattr(item, "rotation_id", "?")
    return f"#{identifier}"


class CrudService(Generic[ModelT]):
    """Async CRUD operations shared by domain modules."""

    def __init__(self, model: type[ModelT], *, entity: str | None = None) -> None:
        self.model = model
        self.entity = entity or model.__tablename__.replace("_", " ")

    def _log(self, session: AsyncSession, action: str, item: Any) -> None:
        actor_id = current_actor_id.get()
        if actor_id is None:
            return
        session.add(
            ActivityLog(
                actor_id=actor_id,
                action=action,
                entity=self.entity,
                summary=f"{action.capitalize()}d {self.entity} {_describe(item)}",
                created_at=datetime.now(timezone.utc),
            )
        )

    async def list(
        self,
        session: AsyncSession,
        *,
        offset: int = 0,
        limit: int = 100,
    ) -> list[ModelT]:
        result = await session.scalars(
            select(self.model).offset(offset).limit(limit)
        )
        return list(result.all())

    async def get(
        self,
        session: AsyncSession,
        identifier: Any,
    ) -> ModelT:
        item = await session.get(self.model, identifier)
        if item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{self.model.__tablename__} record was not found",
            )
        return item

    async def create(
        self,
        session: AsyncSession,
        values: dict[str, Any],
    ) -> ModelT:
        item = self.model(**values)
        session.add(item)
        try:
            await session.flush()
            self._log(session, "create", item)
            await session.commit()
        except IntegrityError as exc:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The record conflicts with an existing record or reference",
            ) from exc
        await session.refresh(item)
        return item

    async def update(
        self,
        session: AsyncSession,
        identifier: Any,
        values: dict[str, Any],
    ) -> ModelT:
        item = await self.get(session, identifier)
        for field, value in values.items():
            setattr(item, field, value)
        try:
            self._log(session, "update", item)
            await session.commit()
        except IntegrityError as exc:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The update conflicts with an existing record or reference",
            ) from exc
        await session.refresh(item)
        return item

    async def delete(
        self,
        session: AsyncSession,
        identifier: Any,
    ) -> None:
        item = await self.get(session, identifier)
        self._log(session, "delete", item)
        await session.delete(item)
        try:
            await session.commit()
        except IntegrityError as exc:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The record is still referenced by another record",
            ) from exc
