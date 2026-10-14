from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import ExcludeConstraint, TSTZRANGE
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Gates(Base):
    __tablename__ = "gates"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    terminal_id: Mapped[int] = mapped_column(ForeignKey("terminals.id"))
    code: Mapped[str] = mapped_column(String(10))
    kind: Mapped[str] = mapped_column(String(20))
    max_size: Mapped[str] = mapped_column(String(1))
    intl_capable: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="open")


class OptimizationRuns(Base):
    __tablename__ = "optimization_runs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    requested_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    horizon_start: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    horizon_end: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    n_flights: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20))
    objective: Mapped[float | None] = mapped_column(Numeric)
    solve_ms: Mapped[int | None] = mapped_column(Integer)


class GateAssignments(Base):
    __tablename__ = "gate_assignments"

    __table_args__ = (
        ExcludeConstraint(
            ("gate_id", "="),
            ("during", "&&"),
            name="exclude_gate_assignments_during",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    rotation_id: Mapped[int] = mapped_column(ForeignKey("rotations.id"))
    gate_id: Mapped[int] = mapped_column(ForeignKey("gates.id"))
    run_id: Mapped[int] = mapped_column(ForeignKey("optimization_runs.id"))
    during: Mapped[object] = mapped_column(TSTZRANGE)
    source: Mapped[str] = mapped_column(String(20))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
