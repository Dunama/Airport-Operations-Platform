import asyncio
import csv
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings
from app.modules.airlines.models import Aircraft, AircraftTypes, Airlines
from app.modules.airports.models import Airports, Terminals
from app.modules.auth.models import Role, User
from app.modules.auth.service import hash_password
from app.modules.flights.models import Flights
from app.modules.gates.models import Gates
from app.modules.operations.models import (
    Baggage,
    BaggageEvents,
    Bookings,
    Incidents,
    Passengers,
    Rotations,
    Shifts,
    Staff,
    StaffAssignments,
    Turnarounds,
)

DATA_FILE = Path(__file__).parent / "airports.csv"

AIRLINES = [
    {"iata": "HM", "name": "Harmattan Air"},
    {"iata": "SJ", "name": "Sahel Jet"},
    {"iata": "NW", "name": "Nile Wings"},
    {"iata": "AB", "name": "Abuja Connect"},
]

ROLES = ["admin", "ops", "airline", "ground"]

AIRCRAFT_TYPES = [
    {"icao_code": "B738", "size": "D", "seats": 162, "typical_turn_min": 45},
    {"icao_code": "A320", "size": "D", "seats": 150, "typical_turn_min": 45},
    {"icao_code": "DH8D", "size": "C", "seats": 78, "typical_turn_min": 30},
    {"icao_code": "B77W", "size": "F", "seats": 396, "typical_turn_min": 90},
]

AIRCRAFT = [
    ("5N-HMA", "B738", "HM"),
    ("5N-HMB", "B738", "HM"),
    ("5N-SJA", "A320", "SJ"),
    ("5N-NWA", "DH8D", "NW"),
    ("5N-ABJ", "B738", "AB"),
]

GATES = [
    ("LOS", "T1", "A1", "contact", "D", False),
    ("LOS", "T1", "A2", "contact", "D", False),
    ("LOS", "T2", "B1", "contact", "F", True),
    ("LOS", "T2", "B2", "contact", "D", True),
    ("ABV", "D1", "G1", "contact", "D", True),
    ("ABV", "D1", "G2", "remote", "C", False),
    ("KAN", "M1", "K1", "remote", "C", False),
]

SEQUENCED_TABLES = [
    "roles",
    "users",
    "airports",
    "terminals",
    "gates",
    "airlines",
    "aircraft_types",
    "aircraft",
    "rotations",
    "flights",
    "passengers",
    "bookings",
    "baggage",
    "baggage_events",
    "staff",
    "shifts",
    "staff_assignments",
    "incidents",
    "charges",
    "flight_events",
    "delay_predictions",
    "optimization_runs",
    "gate_assignments",
]


async def get_or_create(session, model, filters: dict, values: dict):
    """Get an existing record or create a new one if it doesn't exist."""
    conditions = [getattr(model, key) == value for key, value in filters.items()]
    item = await session.scalar(select(model).where(*conditions))
    if item is None:
        item = model(**values)
        session.add(item)
        await session.flush()
    return item


async def reset_sequences(session) -> None:
    """Realign identity sequences after seeding rows with explicit ids."""
    for table in SEQUENCED_TABLES:
        await session.execute(
            text(
                f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), "
                f"COALESCE((SELECT MAX(id) FROM {table}), 0) + 1, false)"
            )
        )


DEMO_PASSWORD = "Passw0rd!"

DEMO_USERS = [
    ("admin@aop.dev", "admin", "HM"),
    ("ops@aop.dev", "ops", "HM"),
    ("ground@aop.dev", "ground", "HM"),
    ("crew1@aop.dev", "ground", "HM"),
    ("crew2@aop.dev", "ground", "HM"),
    ("crew3@aop.dev", "ground", "HM"),
    ("airline@aop.dev", "airline", "HM"),
]

DEMO_AIRCRAFT = [
    ("5N-HMA", "HM"),
    ("5N-HMB", "HM"),
    ("5N-SJA", "SJ"),
    ("5N-NWA", "NW"),
    ("5N-ABJ", "AB"),
]

DEMO_PASSENGERS = [
    ("Amara Okafor", "Nigerian"),
    ("Tunde Balogun", "Nigerian"),
    ("Fatima Yusuf", "Nigerian"),
    ("John Mensah", "Ghanaian"),
    ("Aisha Bello", "Nigerian"),
    ("Chidi Nwosu", "Nigerian"),
    ("Grace Adeyemi", "Nigerian"),
    ("Ibrahim Sani", "Nigerian"),
    ("Ngozi Eze", "Nigerian"),
    ("Kwame Asante", "Ghanaian"),
    ("Zainab Musa", "Nigerian"),
    ("Emeka Obi", "Nigerian"),
]

DEMO_TASKS = ["pushback", "baggage_unload", "catering", "boarding", "deice"]

DEMO_INCIDENTS = [
    ("baggage_delay", 2, "open"),
    ("security", 4, "investigating"),
    ("equipment", 3, "open"),
]


async def seed_demo(session, airport_map: dict) -> None:
    """Seed demo users, flights and operations data spanning today."""
    now = datetime.now(timezone.utc)
    base = now.replace(hour=0, minute=0, second=0, microsecond=0)

    roles = {role.name: role for role in (await session.scalars(select(Role))).all()}
    airlines = {
        airline.iata: airline for airline in (await session.scalars(select(Airlines))).all()
    }
    aircraft = {
        item.registration: item for item in (await session.scalars(select(Aircraft))).all()
    }
    iata_by_airline = {a.id: a.iata for a in airlines.values()}

    user_map: dict[str, User] = {}
    for email, role_name, airline_iata in DEMO_USERS:
        user_map[email] = await get_or_create(
            session,
            User,
            {"email": email},
            {
                "email": email,
                "password": hash_password(DEMO_PASSWORD),
                "role_id": roles[role_name].id,
                "airline_id": airlines[airline_iata].id,
                "is_active": True,
            },
        )

    staff_map: dict[str, Staff] = {}
    ground_emails = [e for e, r, _ in DEMO_USERS if r == "ground"]
    for idx, email in enumerate(ground_emails):
        staff_map[email] = await get_or_create(
            session,
            Staff,
            {"user_id": user_map[email].id},
            {
                "user_id": user_map[email].id,
                "name": email.split("@")[0].replace("crew", "Crew ").title(),
                "skill": DEMO_TASKS[idx % len(DEMO_TASKS)],
            },
        )

    gateway = airport_map["LOS"].id
    spokes = [airport_map[c].id for c in ("ABV", "ENU", "KAN", "PHC")]
    arr_status = ["arrived", "delayed", "on_time", "diverted", "arrived"]
    dep_status = ["boarding", "delayed", "departed", "scheduled", "cancelled"]

    rotation_ids: list[int] = []
    outbound: list[Flights] = []
    inbound: list[Flights] = []

    for idx, (registration, _iata) in enumerate(DEMO_AIRCRAFT):
        plane = aircraft[registration]
        on_block = base + timedelta(hours=8 + idx * 2)
        off_block = on_block + timedelta(hours=1, minutes=30)
        airline_iata = iata_by_airline[plane.airline_id]
        spoke = spokes[idx % len(spokes)]

        rotation = await get_or_create(
            session,
            Rotations,
            {"aircraft_id": plane.id, "on_block_planned": on_block},
            {
                "aircraft_id": plane.id,
                "on_block_planned": on_block,
                "off_block_planned": off_block,
            },
        )
        rotation_ids.append(rotation.id)

        arrival = await get_or_create(
            session,
            Flights,
            {"flight_no": f"{airline_iata}{100 + idx * 2}", "sched_time": on_block - timedelta(minutes=5)},
            {
                "rotation_id": rotation.id,
                "airline_id": plane.airline_id,
                "origin_id": spoke,
                "dest_id": gateway,
                "flight_no": f"{airline_iata}{100 + idx * 2}",
                "direction": "ARR",
                "sched_time": on_block - timedelta(minutes=5),
                "est_time": on_block - timedelta(minutes=5) + timedelta(minutes=25),
                "actual_time": on_block if arr_status[idx] == "arrived" else None,
                "status": arr_status[idx],
                "version": 1,
            },
        )
        inbound.append(arrival)

        departure = await get_or_create(
            session,
            Flights,
            {"flight_no": f"{airline_iata}{101 + idx * 2}", "sched_time": off_block + timedelta(minutes=15)},
            {
                "rotation_id": rotation.id,
                "airline_id": plane.airline_id,
                "origin_id": gateway,
                "dest_id": spoke,
                "flight_no": f"{airline_iata}{101 + idx * 2}",
                "direction": "DEP",
                "sched_time": off_block + timedelta(minutes=15),
                "est_time": off_block + timedelta(minutes=15) + timedelta(minutes=35),
                "actual_time": off_block + timedelta(minutes=15) if dep_status[idx] == "departed" else None,
                "status": dep_status[idx],
                "version": 1,
            },
        )
        outbound.append(departure)

        if await session.get(Turnarounds, rotation.id) is None:
            session.add(
                Turnarounds(
                    rotation_id=rotation.id,
                    aldt=on_block - timedelta(minutes=5),
                    aibt=on_block,
                    tsat=on_block + timedelta(minutes=65),
                    tobt=on_block + timedelta(minutes=70),
                    aobt=off_block - timedelta(minutes=10),
                    atot=off_block,
                    predicted_ready=on_block + timedelta(minutes=68),
                )
            )
            await session.flush()

    for idx, (name, nationality) in enumerate(DEMO_PASSENGERS):
        passenger = await get_or_create(
            session,
            Passengers,
            {"name": name},
            {"name": name, "nationality": nationality},
        )
        flight = outbound[idx % len(outbound)]
        seat = f"{10 + idx}{'ABCDEF'[idx % 6]}"
        booking = await get_or_create(
            session,
            Bookings,
            {"flight_id": flight.id, "seat": seat},
            {
                "flight_id": flight.id,
                "passenger_id": passenger.id,
                "seat": seat,
                "checked_in_at": base + timedelta(hours=7 + idx % 5),
                "boarded_at": None,
            },
        )
        tag = f"{flight.flight_no}-{idx + 1:04d}"
        bag = await get_or_create(
            session,
            Baggage,
            {"tag": tag},
            {"booking_id": booking.id, "tag": tag, "weight_kg": 12 + idx % 9},
        )
        for location, minutes in (("check-in", 0), ("sortation", 9), ("apron", 22)):
            await get_or_create(
                session,
                BaggageEvents,
                {"baggage_id": bag.id, "location": location},
                {
                    "baggage_id": bag.id,
                    "location": location,
                    "scanned_at": base + timedelta(hours=7 + idx % 5, minutes=minutes),
                },
            )

    shift_ids: list[int] = []
    for idx, staff in enumerate(staff_map.values()):
        existing = await session.scalar(
            select(Shifts.id).where(Shifts.staff_id == staff.id)
        )
        if existing is not None:
            shift_ids.append(existing)
            continue
        start = base + timedelta(hours=6 + idx)
        end = start + timedelta(hours=8)
        row = await session.execute(
            text(
                "INSERT INTO shifts (staff_id, during) "
                "VALUES (:staff_id, tstzrange(:start, :end, '[)')) "
                "RETURNING id"
            ),
            {"staff_id": staff.id, "start": start, "end": end},
        )
        shift_ids.append(row.scalar_one())

    for idx, shift_id in enumerate(shift_ids):
        rotation_id = rotation_ids[idx % len(rotation_ids)]
        await get_or_create(
            session,
            StaffAssignments,
            {"shift_id": shift_id, "rotation_id": rotation_id},
            {
                "shift_id": shift_id,
                "rotation_id": rotation_id,
                "task": DEMO_TASKS[idx % len(DEMO_TASKS)],
            },
        )

    gates = [gate.id for gate in (await session.scalars(select(Gates).order_by(Gates.id))).all()]
    reporter = user_map["ground@aop.dev"].id
    for idx, (category, severity, incident_status) in enumerate(DEMO_INCIDENTS):
        flight = outbound[idx % len(outbound)]
        await get_or_create(
            session,
            Incidents,
            {"flight_id": flight.id, "category": category},
            {
                "flight_id": flight.id,
                "gate_id": gates[idx % len(gates)],
                "reported_by": reporter,
                "category": category,
                "severity": severity,
                "status": incident_status,
                "created_at": now - timedelta(minutes=30 * (idx + 1)),
                "closed_at": None,
            },
        )

    print(
        f"Demo data ready: {len(user_map)} users, "
        f"{len(rotation_ids)} rotations, "
        f"{len(inbound) + len(outbound)} flights, "
        f"{len(shift_ids)} shifts."
    )


async def run() -> None:
    """Run the seed script to populate the database with initial data."""
    engine = create_async_engine(settings.database_url, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        for role_name in ROLES:
            await get_or_create(
                session,
                Role,
                {"name": role_name},
                {"name": role_name},
            )

        # Seed airports from the CSV file
        airport_map = {}
        with DATA_FILE.open(newline="", encoding="utf-8") as file:
            for row in csv.DictReader(file, delimiter="\t"):
                iata = row.get("iata_code", "").strip().upper()
                if len(iata) != 3:
                    continue

                icao = (row.get("icao_code") or row.get("ident") or "").strip().upper()
                if len(icao) != 4:
                    continue

                airport = await get_or_create(
                    session,
                    Airports,
                    {"iata": iata},
                    {
                        "iata": iata,
                        "icao": icao,
                        "name": row.get("name", iata).strip(),
                        "timezone": "Africa/Lagos",
                    },
                )
                airport_map[iata] = airport

        airline_map = {}
        for values in AIRLINES:
            airline = await get_or_create(
                session, Airlines, {"iata": values["iata"]}, values
            )
            airline_map[values["iata"]] = airline

        type_map = {}
        for values in AIRCRAFT_TYPES:
            aircraft_type = await get_or_create(
                session,
                AircraftTypes,
                {"icao_code": values["icao_code"]},
                values,
            )
            type_map[values["icao_code"]] = aircraft_type

        aircraft_map = {}
        for registration, type_code, airline_iata in AIRCRAFT:
            aircraft = await get_or_create(
                session,
                Aircraft,
                {"registration": registration},
                {
                    "registration": registration,
                    "airline_id": airline_map[airline_iata].id,
                    "type_id": type_map[type_code].id,
                },
            )
            aircraft_map[registration] = aircraft

        terminal_map = {}
        for airport_iata, terminal_code, *_ in GATES:
            airport = airport_map.get(airport_iata)
            if airport is None:
                continue
            terminal = await get_or_create(
                session,
                Terminals,
                {"airport_id": airport.id, "code": terminal_code},
                {"airport_id": airport.id, "code": terminal_code},
            )
            terminal_map[(airport_iata, terminal_code)] = terminal

        for airport_iata, terminal_code, gate_code, kind, max_size, intl_capable in GATES:
            terminal = terminal_map.get((airport_iata, terminal_code))
            if terminal is None:
                continue
            await get_or_create(
                session,
                Gates,
                {"terminal_id": terminal.id, "code": gate_code},
                {
                    "terminal_id": terminal.id,
                    "code": gate_code,
                    "kind": kind,
                    "max_size": max_size,
                    "intl_capable": intl_capable,
                    "status": "open",
                },
            )

        await seed_demo(session, airport_map)
        await reset_sequences(session)

        await session.commit()
        print("Seed complete.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run())
