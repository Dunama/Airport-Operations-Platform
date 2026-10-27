from datetime import datetime
from decimal import Decimal

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


class GateUpdate(Schema):
    terminal_id: int | None = None
    code: str | None = Field(default=None, min_length=1, max_length=10)
    kind: str | None = Field(default=None, pattern="^(contact|remote)$")
    max_size: str | None = Field(default=None, pattern="^[CDEF]$")
    intl_capable: bool | None = None
    status: str | None = Field(default=None, pattern="^(open|closed|maintenance)$")


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


class OptimizationRunUpdate(Schema):
    status: str | None = Field(default=None, min_length=1, max_length=20)
    objective: Decimal | None = None
    solve_ms: int | None = Field(default=None, ge=0)


class OptimizationRunRead(OptimizationRunBase):
    id: int


class GateAssignmentBase(Schema):
    rotation_id: int
    gate_id: int
    run_id: int
    source: str = Field(pattern="^(manual|greedy|optimizer)$")
    is_active: bool = True


class GateAssignmentCreate(GateAssignmentBase):
    start: datetime
    end: datetime


class GateAssignmentUpdate(Schema):
    gate_id: int | None = None
    source: str | None = Field(default=None, pattern="^(manual|greedy|optimizer)$")
    is_active: bool | None = None
    start: datetime | None = None
    end: datetime | None = None


class GateAssignmentRead(GateAssignmentBase):
    id: int
    start: datetime
    end: datetime
