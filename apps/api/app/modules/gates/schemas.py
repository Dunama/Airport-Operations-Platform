from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import Field

from app.core.schemas import Schema


class GateBase(Schema):
    terminal_id: int
    code: str = Field(min_length=1, max_length=10)
    kind: str = Field(pattern="^(contact|remote)$")
    max_size: str = Field(pattern="^[CDEF]$")
    intl_capable: bool = False
    status: str = Field(default="open", pattern="^(open|closed|maintenance)$")


class GateCreate(GateBase):
    pass


class GateRead(GateBase):
    id: int


class OptimizationRunBase(Schema):
    requested_by: int
    horizon_start: datetime
    horizon_end: datetime
    n_flights: int = Field(ge=0)
    status: str = Field(min_length=1, max_length=20)
    objective: Decimal | None = None
    solve_ms: int | None = Field(default=None, ge=0)


class OptimizationRunCreate(OptimizationRunBase):
    pass


class OptimizationRunRead(OptimizationRunBase):
    id: int


class GateAssignmentBase(Schema):
    rotation_id: int
    gate_id: int
    run_id: int
    during: Any
    source: str = Field(pattern="^(manual|greedy|optimizer)$")
    is_active: bool = True


class GateAssignmentCreate(GateAssignmentBase):
    pass


class GateAssignmentRead(GateAssignmentBase):
    id: int
