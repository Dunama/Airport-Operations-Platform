from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# pool_pre_ping replaces connections dropped while Neon was suspended

engine = create_async_engine(

    settings.database_url,

    pool_pre_ping=True,

    pool_size=5,

    max_overflow=5,

)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):

    pass


async def get_session():

    async with SessionLocal() as session:

        yield session
