import pytest

from app.persistence.model.user import User
from app.persistence.repository.user import UserRepository


@pytest.mark.asyncio
async def test_create_user(user_repository: UserRepository):
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password="hashedpassword",
    )
    created_user = await user_repository.create(user)
    assert created_user.id is not None
    assert created_user.email == "test@example.com"


@pytest.mark.asyncio
async def test_get_user_by_email(user_repository: UserRepository):
    user = User(
        email="test2@example.com",
        username="testuser2",
        hashed_password="hashedpassword",
    )
    await user_repository.create(user)

    fetched_user = await user_repository.get_by_email("test2@example.com")
    assert fetched_user is not None
    assert fetched_user.email == "test2@example.com"

    fetched_user_none = await user_repository.get_by_email("nonexistent@example.com")
    assert fetched_user_none is None
