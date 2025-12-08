import pytest

from app.domain.schemas.user import UserCreate
from app.domain.services.auth import AuthService
from app.domain.services.user import UserService
from app.persistence.repository.token import RefreshTokenRepository


@pytest.mark.asyncio
async def test_authenticate_success(
    auth_service: AuthService, user_service: UserService
):
    user_in = UserCreate(
        email="auth@example.com", username="authuser", password="password123"
    )
    await user_service.create_user(user_in)

    user = await auth_service.authenticate("auth@example.com", "password123")
    assert user is not None
    assert user.email == "auth@example.com"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "email,password",
    [
        ("nonexistent@example.com", "password"),
        ("auth@example.com", "wrongpassword"),
    ],
)
async def test_authenticate_failure(
    auth_service: AuthService, user_service: UserService, email, password
):
    # Ensure user exists for the wrong password case
    if email == "auth@example.com":
        user_in = UserCreate(
            email="auth@example.com", username="authuser", password="password123"
        )
        # Check if user already exists (from previous test or fixture isolation)
        # Pytest fixtures are function scoped by default, so DB is clean.
        await user_service.create_user(user_in)

    user = await auth_service.authenticate(email, password)
    assert user is None


@pytest.mark.asyncio
async def test_create_tokens(auth_service: AuthService, user_service: UserService):
    user_in = UserCreate(
        email="tokens@example.com", username="tokensuser", password="password123"
    )
    user = await user_service.create_user(user_in)

    token = await auth_service.create_tokens(user)
    assert token.access_token is not None
    assert token.refresh_token is not None
    assert token.token_type == "bearer"


@pytest.mark.asyncio
async def test_refresh_access_token(
    auth_service: AuthService, user_service: UserService
):
    user_in = UserCreate(
        email="refresh@example.com", username="refreshuser", password="password123"
    )
    user = await user_service.create_user(user_in)
    token = await auth_service.create_tokens(user)

    new_token = await auth_service.refresh_access_token(token.refresh_token)
    assert new_token is not None
    assert new_token.refresh_token != token.refresh_token


@pytest.mark.asyncio
async def test_refresh_token_reuse_detection(
    auth_service: AuthService, user_service: UserService
):
    user_in = UserCreate(
        email="reuse@example.com", username="reuseuser", password="password123"
    )
    user = await user_service.create_user(user_in)
    token1 = await auth_service.create_tokens(user)

    # First refresh: Success
    token2 = await auth_service.refresh_access_token(token1.refresh_token)
    assert token2 is not None

    # Reuse token1: Should fail (return None) and revoke token2
    reuse_result = await auth_service.refresh_access_token(token1.refresh_token)
    assert reuse_result is None

    # Try to use token2: Should fail because it was revoked by reuse of token1
    token2_result = await auth_service.refresh_access_token(token2.refresh_token)
    assert token2_result is None


@pytest.mark.asyncio
async def test_logout(auth_service: AuthService, user_service: UserService):
    user_in = UserCreate(
        email="logout@example.com", username="logoutuser", password="password123"
    )
    user = await user_service.create_user(user_in)
    token = await auth_service.create_tokens(user)

    success = await auth_service.logout(token.refresh_token)
    assert success is True

    # Try to refresh with revoked token
    new_token = await auth_service.refresh_access_token(token.refresh_token)
    assert new_token is None


@pytest.mark.asyncio
async def test_refresh_token_reuse_revokes_all(
    auth_service: AuthService,
    user_service: UserService,
    refresh_token_repository: RefreshTokenRepository,
):
    user_in = UserCreate(
        email="reuse@example.com", username="reuseuser", password="password123"
    )
    user = await user_service.create_user(user_in)

    # Create two tokens
    token1 = await auth_service.create_tokens(user)
    token2 = await auth_service.create_tokens(user)

    # Revoke token1 (simulate logout or previous refresh)
    await auth_service.logout(token1.refresh_token)

    # Verify token1 is revoked
    stored_token1 = await refresh_token_repository.get_by_token(token1.refresh_token)
    assert stored_token1 is not None
    assert stored_token1.revoked_at is not None

    # Verify token2 is active
    stored_token2 = await refresh_token_repository.get_by_token(token2.refresh_token)
    assert stored_token2 is not None
    assert stored_token2.revoked_at is None

    # Try to refresh with revoked token1 (Reuse attack)
    result = await auth_service.refresh_access_token(token1.refresh_token)
    assert result is None

    # Verify token2 is now revoked
    stored_token2_revoked = await refresh_token_repository.get_by_token(
        token2.refresh_token
    )
    assert stored_token2_revoked is not None
    assert stored_token2_revoked.revoked_at is not None
