from datetime import UTC, datetime, timedelta

import pytest

from app.persistence.model.token import RefreshToken
from app.persistence.model.user import User
from app.persistence.repository.token import RefreshTokenRepository
from app.persistence.repository.user import UserRepository


@pytest.mark.asyncio
async def test_create_and_get_token(
    refresh_token_repository: RefreshTokenRepository, user_repository: UserRepository
):
    user = User(
        email="token@example.com",
        username="tokenuser",
        hashed_password="hashedpassword",
    )
    user = await user_repository.create(user)

    token = RefreshToken(
        token="some_random_token",
        expires_at=datetime.now(UTC) + timedelta(days=7),
        user_id=user.id,
    )
    created_token = await refresh_token_repository.create(token)
    assert created_token.id is not None

    fetched_token = await refresh_token_repository.get_by_token("some_random_token")
    assert fetched_token is not None
    assert fetched_token.token == "some_random_token"
    assert fetched_token.user_id == user.id
