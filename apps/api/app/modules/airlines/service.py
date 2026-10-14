from app.core.crud import CrudService
from app.modules.airlines.models import Airlines


class AirlineService(CrudService[Airlines]):
	"""Application service for airline records."""

	pass

__all__ = ["AirlineService", "CrudService"]
