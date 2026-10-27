from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.dialects.postgresql import Range
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crud import CrudService
from app.core.db import get_session
from app.modules.auth.models import User
from app.modules.auth.router import get_current_user, require_role
from app.modules.gates.models import GateAssignments, Gates, OptimizationRuns
from app.modules.gates.schemas import (
    GateAssignmentCreate,
    GateAssignmentRead,
    GateAssignmentUpdate,
    GateCreate,
    GateRead,
    GateUpdate,
    OptimizationRunCreate,
    OptimizationRunRead,
    OptimizationRunUpdate,
)


router = APIRouter()
gate_assignment_router = APIRouter()
optimization_run_router = APIRouter()

gate_service = CrudService(Gates, entity="gate")
gate_assignment_service = CrudService(GateAssignments, entity="gate assignment")
optimization_run_service = CrudService(OptimizationRuns, entity="optimization run")

manage_gates = require_role("admin", "ops")


def _gate_assignment_read(assignment: GateAssignments) -> GateAssignmentRead:
    return GateAssignmentRead(
        id=assignment.id,
        rotation_id=assignment.rotation_id,
        gate_id=assignment.gate_id,
        run_id=assignment.run_id,
        source=assignment.source,
        is_active=assignment.is_active,
        start=assignment.during.lower,
        end=assignment.during.upper,
    )


@router.get("", response_model=list[GateRead])
async def list_gates(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await gate_service.list(session, offset=offset, limit=limit)


@router.post("", response_model=GateRead, status_code=status.HTTP_201_CREATED)
async def create_gate(
    payload: GateCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_gates),
):
    return await gate_service.create(session, payload.model_dump())


@router.get("/{gate_id}", response_model=GateRead)
async def get_gate(
    gate_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await gate_service.get(session, gate_id)


@router.put("/{gate_id}", response_model=GateRead)
async def update_gate(
    gate_id: int,
    payload: GateUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_gates),
):
    return await gate_service.update(
        session, gate_id, payload.model_dump(exclude_unset=True)
    )


@router.delete("/{gate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_gate(
    gate_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_gates),
):
    await gate_service.delete(session, gate_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@gate_assignment_router.get("", response_model=list[GateAssignmentRead])
async def list_gate_assignments(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    assignments = await gate_assignment_service.list(
        session, offset=offset, limit=limit
    )
    return [_gate_assignment_read(a) for a in assignments]


@gate_assignment_router.post(
    "", response_model=GateAssignmentRead, status_code=status.HTTP_201_CREATED
)
async def create_gate_assignment(
    payload: GateAssignmentCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_gates),
):
    values = payload.model_dump(exclude={"start", "end"})
    values["during"] = Range(payload.start, payload.end)
    assignment = await gate_assignment_service.create(session, values)
    return _gate_assignment_read(assignment)


@gate_assignment_router.get("/{assignment_id}", response_model=GateAssignmentRead)
async def get_gate_assignment(
    assignment_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    assignment = await gate_assignment_service.get(session, assignment_id)
    return _gate_assignment_read(assignment)


@gate_assignment_router.put("/{assignment_id}", response_model=GateAssignmentRead)
async def update_gate_assignment(
    assignment_id: int,
    payload: GateAssignmentUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_gates),
):
    values = payload.model_dump(exclude_unset=True, exclude={"start", "end"})
    if payload.start is not None or payload.end is not None:
        current = await gate_assignment_service.get(session, assignment_id)
        start = payload.start or current.during.lower
        end = payload.end or current.during.upper
        values["during"] = Range(start, end)
    assignment = await gate_assignment_service.update(session, assignment_id, values)
    return _gate_assignment_read(assignment)


@gate_assignment_router.delete(
    "/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_gate_assignment(
    assignment_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_gates),
):
    await gate_assignment_service.delete(session, assignment_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@optimization_run_router.get("", response_model=list[OptimizationRunRead])
async def list_optimization_runs(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return await optimization_run_service.list(session, offset=offset, limit=limit)


@optimization_run_router.post(
    "", response_model=OptimizationRunRead, status_code=status.HTTP_201_CREATED
)
async def create_optimization_run(
    payload: OptimizationRunCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_gates),
):
    return await optimization_run_service.create(session, payload.model_dump())


@optimization_run_router.put("/{run_id}", response_model=OptimizationRunRead)
async def update_optimization_run(
    run_id: int,
    payload: OptimizationRunUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(manage_gates),
):
    return await optimization_run_service.update(
        session, run_id, payload.model_dump(exclude_unset=True)
    )
