from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from app.core.config import get_settings
from app.core.database import get_session
from app.domain.services.auth import AuthService
from app.domain.services.study_plan import StudyPlanService
from app.domain.services.user import UserService
from app.main import app
from app.persistence.repository.study_plan import StudyPlanRepository
from app.persistence.repository.token import RefreshTokenRepository
from app.persistence.repository.user import UserRepository

settings = get_settings()


@pytest.fixture(name="session")
async def session_fixture() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine(
        settings.DATABASE_TEST_URL,
        echo=False,
        future=True,
        connect_args={"check_same_thread": False},
    )

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async_session = async_sessionmaker(engine, expire_on_commit=False)
    async with async_session() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)

    await engine.dispose()


@pytest.fixture(name="client")
async def client_fixture(session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    app.dependency_overrides[get_session] = lambda: session
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
def user_repository(session: AsyncSession) -> UserRepository:
    return UserRepository(session)


@pytest.fixture
def refresh_token_repository(session: AsyncSession) -> RefreshTokenRepository:
    return RefreshTokenRepository(session)


@pytest.fixture
def user_service(user_repository: UserRepository) -> UserService:
    return UserService(user_repository)


@pytest.fixture
def auth_service(
    user_repository: UserRepository, refresh_token_repository: RefreshTokenRepository
) -> AuthService:
    return AuthService(user_repository, refresh_token_repository)


@pytest.fixture
def study_plan_repository(session: AsyncSession) -> StudyPlanRepository:
    return StudyPlanRepository(session)


@pytest.fixture
def study_plan_service(study_plan_repository: StudyPlanRepository) -> StudyPlanService:
    return StudyPlanService(study_plan_repository)
