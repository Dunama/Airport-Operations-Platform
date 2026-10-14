from app.core.crud import CrudService
from app.modules.gates.models import Gates


class GateService(CrudService[Gates]):
	"""Application service for gate records."""

	pass

__all__ = ["GateService", "CrudService"]
