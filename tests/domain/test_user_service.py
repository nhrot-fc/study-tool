import pytest

from app.core.security import verify_password
from app.domain.exceptions.base import AlreadyExistsException
from app.domain.schemas.user import UserCreate
from app.domain.services.user import UserService


@pytest.mark.asyncio
async def test_create_user_service(user_service: UserService):
    user_in = UserCreate(
        email="service@example.com",
        username="serviceuser",
        password="password123",
    )
    user = await user_service.create_user(user_in)
    assert user.id is not None
    assert user.email == "service@example.com"
    assert verify_password("password123", user.hashed_password)


@pytest.mark.asyncio
async def test_get_user_by_email_service(user_service: UserService):
    user_in = UserCreate(
        email="service2@example.com",
        username="serviceuser2",
        password="password123",
    )
    await user_service.create_user(user_in)

    user = await user_service.get_user_by_email("service2@example.com")
    assert user is not None
    assert user.email == "service2@example.com"


@pytest.mark.asyncio
async def test_create_user_duplicate_email(user_service: UserService):
    user_in = UserCreate(
        email="duplicate@example.com",
        username="user1",
        password="password123",
    )
    await user_service.create_user(user_in)

    user_in_2 = UserCreate(
        email="duplicate@example.com",
        username="user2",
        password="password123",
    )
    with pytest.raises(AlreadyExistsException):
        await user_service.create_user(user_in_2)
