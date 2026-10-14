from app.core.crud import CrudService
from app.modules.airports.models import Airports


class AirportService(CrudService[Airports]):
	"""Application service for airport records."""

	pass

__all__ = ["AirportService", "CrudService"]
