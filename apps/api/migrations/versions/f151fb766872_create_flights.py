"""complete airport operations schema

Revision ID: f151fb766872
Revises: 1486810276ca
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ExcludeConstraint, JSONB, TSTZRANGE


revision: str = "f151fb766872"
down_revision: Union[str, Sequence[str], None] = "1486810276ca"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index("ix_flights_flight_number", table_name="flights")
    op.drop_table("flights")

    op.create_table(
        "airports",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("iata", sa.String(3), nullable=False, unique=True),
        sa.Column("icao", sa.String(4), nullable=False, unique=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("timezone", sa.String(50), nullable=False),
    )
    op.create_table(
        "terminals",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("airport_id", sa.BigInteger(), sa.ForeignKey("airports.id"), nullable=False),
        sa.Column("code", sa.String(10), nullable=False),
    )
    op.create_table(
        "gates",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("terminal_id", sa.BigInteger(), sa.ForeignKey("terminals.id"), nullable=False),
        sa.Column("code", sa.String(10), nullable=False),
        sa.Column("kind", sa.String(20), nullable=False),
        sa.Column("max_size", sa.String(1), nullable=False),
        sa.Column("intl_capable", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("status", sa.String(20), nullable=False, server_default="open"),
    )
    op.create_table(
        "airlines",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("iata", sa.String(3), nullable=False, unique=True),
        sa.Column("name", sa.String(100), nullable=False),
    )
    op.create_table(
        "aircraft_types",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("icao_code", sa.String(4), nullable=False, unique=True),
        sa.Column("size", sa.String(20), nullable=False),
        sa.Column("seats", sa.Integer(), nullable=False),
        sa.Column("typical_turn_min", sa.Integer(), nullable=False),
    )
    op.create_table(
        "aircraft",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("registration", sa.String(20), nullable=False, unique=True),
        sa.Column("airline_id", sa.BigInteger(), sa.ForeignKey("airlines.id"), nullable=False),
        sa.Column("type_id", sa.BigInteger(), sa.ForeignKey("aircraft_types.id"), nullable=False),
    )
    op.create_table(
        "rotations",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("aircraft_id", sa.BigInteger(), sa.ForeignKey("aircraft.id"), nullable=False),
        sa.Column("on_block_planned", sa.DateTime(timezone=True), nullable=False),
        sa.Column("off_block_planned", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "flights",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("rotation_id", sa.BigInteger(), sa.ForeignKey("rotations.id"), nullable=False),
        sa.Column("airline_id", sa.BigInteger(), sa.ForeignKey("airlines.id"), nullable=False),
        sa.Column("origin_id", sa.BigInteger(), sa.ForeignKey("airports.id"), nullable=False),
        sa.Column("dest_id", sa.BigInteger(), sa.ForeignKey("airports.id"), nullable=False),
        sa.Column("flight_no", sa.String(20), nullable=False),
        sa.Column("direction", sa.String(3), nullable=False),
        sa.Column("sched_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("est_time", sa.DateTime(timezone=True)),
        sa.Column("actual_time", sa.DateTime(timezone=True)),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
    )
    op.create_table(
        "turnarounds",
        sa.Column("rotation_id", sa.BigInteger(), sa.ForeignKey("rotations.id"), primary_key=True),
        *[
            sa.Column(name, sa.DateTime(timezone=True))
            for name in ("aldt", "aibt", "tobt", "tsat", "aobt", "atot", "predicted_ready")
        ],
    )
    op.create_table(
        "roles",
        sa.Column("id", sa.SmallInteger(), primary_key=True),
        sa.Column("name", sa.String(50), nullable=False, unique=True),
    )
    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password", sa.String(255), nullable=False),
        sa.Column("role_id", sa.SmallInteger(), sa.ForeignKey("roles.id"), nullable=False),
        sa.Column("airline_id", sa.BigInteger(), sa.ForeignKey("airlines.id"), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_table(
        "optimization_runs",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("requested_by", sa.BigInteger(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("horizon_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("horizon_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("n_flights", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("objective", sa.Numeric()),
        sa.Column("solve_ms", sa.Integer()),
    )
    op.create_table(
        "gate_assignments",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("rotation_id", sa.BigInteger(), sa.ForeignKey("rotations.id"), nullable=False),
        sa.Column("gate_id", sa.BigInteger(), sa.ForeignKey("gates.id"), nullable=False),
        sa.Column("run_id", sa.BigInteger(), sa.ForeignKey("optimization_runs.id"), nullable=False),
        sa.Column("during", TSTZRANGE, nullable=False),
        sa.Column("source", sa.String(20), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        ExcludeConstraint(("gate_id", "="), ("during", "&&"), name="exclude_gate_assignments_during"),
    )
    op.create_table(
        "flight_events",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("flight_id", sa.BigInteger(), sa.ForeignKey("flights.id"), nullable=False),
        sa.Column("actor_user_id", sa.BigInteger(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("payload", JSONB, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "delay_predictions",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("flight_id", sa.BigInteger(), sa.ForeignKey("flights.id"), nullable=False),
        sa.Column("model_version", sa.String(50), nullable=False),
        sa.Column("p_delay_15", sa.Float(), nullable=False),
        sa.Column("expected_delay_min", sa.Float(), nullable=False),
        sa.Column("top_factors", JSONB, nullable=False),
        sa.Column("scored_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "passengers",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("nationality", sa.String(50), nullable=False),
    )
    op.create_table(
        "bookings",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("flight_id", sa.BigInteger(), sa.ForeignKey("flights.id"), nullable=False),
        sa.Column("passenger_id", sa.BigInteger(), sa.ForeignKey("passengers.id"), nullable=False),
        sa.Column("seat", sa.String(10), nullable=False),
        sa.Column("checked_in_at", sa.DateTime(timezone=True)),
        sa.Column("boarded_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "baggage",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("booking_id", sa.BigInteger(), sa.ForeignKey("bookings.id"), nullable=False),
        sa.Column("tag", sa.String(50), nullable=False, unique=True),
        sa.Column("weight_kg", sa.Numeric(), nullable=False),
    )
    op.create_table(
        "baggage_events",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("baggage_id", sa.BigInteger(), sa.ForeignKey("baggage.id"), nullable=False),
        sa.Column("location", sa.String(100), nullable=False),
        sa.Column("scanned_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "staff",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("user_id", sa.BigInteger(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("skill", sa.String(50), nullable=False),
    )
    op.create_table(
        "shifts",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("staff_id", sa.BigInteger(), sa.ForeignKey("staff.id"), nullable=False),
        sa.Column("during", TSTZRANGE, nullable=False),
        ExcludeConstraint(("staff_id", "="), ("during", "&&"), name="exclude_shifts_during"),
    )
    op.create_table(
        "staff_assignments",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("shift_id", sa.BigInteger(), sa.ForeignKey("shifts.id"), nullable=False),
        sa.Column("rotation_id", sa.BigInteger(), sa.ForeignKey("rotations.id"), nullable=False),
        sa.Column("task", sa.String(100), nullable=False),
    )
    op.create_table(
        "incidents",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("flight_id", sa.BigInteger(), sa.ForeignKey("flights.id"), nullable=False),
        sa.Column("gate_id", sa.BigInteger(), sa.ForeignKey("gates.id"), nullable=False),
        sa.Column("reported_by", sa.BigInteger(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("severity", sa.SmallInteger(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("closed_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "charges",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("flight_id", sa.BigInteger(), sa.ForeignKey("flights.id"), nullable=False),
        sa.Column("kind", sa.String(50), nullable=False),
        sa.Column("amount_minor", sa.BigInteger(), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
    )
    op.create_table(
        "weather_observations",
        sa.Column("airport_id", sa.BigInteger(), sa.ForeignKey("airports.id"), primary_key=True),
        sa.Column("observed_at", sa.DateTime(timezone=True), primary_key=True),
        sa.Column("wind_kt", sa.Integer(), nullable=False),
        sa.Column("visibility_m", sa.Integer(), nullable=False),
        sa.Column("ceiling_ft", sa.Integer(), nullable=False),
        sa.Column("thunderstorm", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    for table in (
        "weather_observations",
        "charges",
        "incidents",
        "staff_assignments",
        "shifts",
        "staff",
        "baggage_events",
        "baggage",
        "bookings",
        "passengers",
        "delay_predictions",
        "flight_events",
        "gate_assignments",
        "optimization_runs",
        "users",
        "roles",
        "turnarounds",
        "flights",
        "rotations",
        "aircraft",
        "aircraft_types",
        "airlines",
        "gates",
        "terminals",
        "airports",
    ):
        op.drop_table(table)
