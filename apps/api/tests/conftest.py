import os

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.db import Base, get_session   # adjust to your names
from app.modules.auth.router import get_current_user
from app.main import app

TEST_DB_URL = os.getenv(
    "TEST_DB_URL",
    "postgresql+asyncpg://airport:airport@localhost:5432/airport_test",
)


@pytest.fixture
async def client():
    engine = create_async_engine(TEST_DB_URL, poolclass=NullPool)
    async with engine.begin() as conn:
        await conn.exec_driver_sql(
            "CREATE EXTENSION IF NOT EXISTS btree_gist"
        )
        await conn.run_sync(Base.metadata.create_all)

    maker = async_sessionmaker(engine, expire_on_commit=False)

    async def override():
        async with maker() as session:
            yield session

    app.dependency_overrides[get_session] = override
    app.dependency_overrides[get_current_user] = lambda: type(
        "TestAdmin",
        (),
        {
            "role": type("TestRole", (), {"name": "admin"})(),
            "airline_id": 1,
        },
    )()
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c

    app.dependency_overrides.clear()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()