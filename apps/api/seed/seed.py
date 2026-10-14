import asyncio
import csv
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings
from app.modules.airlines.models import Aircraft, AircraftTypes, Airlines
from app.modules.airports.models import Airports, Terminals
from app.modules.auth.models import Role
from app.modules.gates.models import Gates

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

async def get_or_create(session, model, filters: dict, values: dict):
    """Get an existing record or create a new one if it doesn't exist."""
    conditions = [getattr(model, key) == value for key, value in filters.items()]
    item = await session.scalar(select(model).where(*conditions))
    if item is None:
        next_id = await session.scalar(
            select(func.coalesce(func.max(model.id), 0) + 1)
        )
        values = {"id": next_id, **values}
        item = model(**values)
        session.add(item)
        await session.flush()
    return item


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

        await session.commit()
        print("Seed complete.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run())
