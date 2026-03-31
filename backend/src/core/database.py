import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://aise:aise1234@localhost:5432/aise",
)

# DB_SSL=false 설정 시 asyncpg SSL 비활성화
# (Windows 한글 사용자 경로에서 SSL 인증서 로드 시 Illegal byte sequence 에러 방지)
connect_args: dict = {}
if os.getenv("DB_SSL", "").lower() in ("false", "0", "no"):
    connect_args["ssl"] = False

engine = create_async_engine(DATABASE_URL, echo=False, connect_args=connect_args)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    """FastAPI Depends용 DB 세션 제공"""
    async with async_session() as session:
        yield session
