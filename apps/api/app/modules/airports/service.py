from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crud import CrudService
from app.modules.airports.models import Airports


class AirportService(CrudService[Airports]):
	"""Application service for airport records."""

	@staticmethod
	def _search_filter(term: str):
		pattern = f"%{term.strip()}%"
		return or_(
			Airports.iata.ilike(pattern),
			Airports.icao.ilike(pattern),
			Airports.name.ilike(pattern),
		)

	async def count(
		self,
		session: AsyncSession,
		search: str | None = None,
	) -> int:
		"""Total airports, optionally narrowed by the search term."""
		statement = select(func.count()).select_from(Airports)
		if search and search.strip():
			statement = statement.where(self._search_filter(search))
		return int(await session.scalar(statement) or 0)

	async def search(
		self,
		session: AsyncSession,
		term: str,
		*,
		offset: int = 0,
		limit: int = 20,
	) -> "list[Airports]":
		"""Case-insensitive lookup by IATA, ICAO or name for pickers/tables."""
		needle = term.strip()
		if not needle:
			return []
		result = await session.scalars(
			select(Airports)
			.where(self._search_filter(needle))
			.order_by(Airports.iata)
			.offset(offset)
			.limit(limit)
		)
		return list(result.all())

	# Defined last so the `list` name does not shadow the builtin in annotations
	# of the methods above.
	async def list(
		self,
		session: AsyncSession,
		*,
		offset: int = 0,
		limit: int = 100,
	) -> "list[Airports]":
		"""Stable, IATA-ordered page so pagination is deterministic."""
		result = await session.scalars(
			select(Airports).order_by(Airports.iata).offset(offset).limit(limit)
		)
		return list(result.all())

__all__ = ["AirportService", "CrudService"]
