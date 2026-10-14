from app.core.crud import CrudService
from app.modules.operations.models import Rotations


class OperationsService(CrudService[Rotations]):
	"""Application service for operational timeline records."""

	pass

__all__ = ["CrudService", "OperationsService"]
