import pytest
from httpx import AsyncClient

from app.domain.schemas.user import UserCreate
from app.domain.services.user import UserService


@pytest.mark.asyncio
async def test_login(client: AsyncClient, user_service: UserService):
    user_in = UserCreate(
        email="api_login@example.com", username="api_loginuser", password="password123"
    )
    await user_service.create_user(user_in)

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "api_login@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login", json={"email": "wrong@example.com", "password": "wrong"}
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, user_service: UserService):
    user_in = UserCreate(
        email="api_refresh@example.com",
        username="api_refreshuser",
        password="password123",
    )
    await user_service.create_user(user_in)

    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "api_refresh@example.com", "password": "password123"},
    )
    login_data = login_response.json()
    assert login_response.status_code == 200
    assert "refresh_token" in login_data
    refresh_token = login_data["refresh_token"]

    response = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
    )
    data = response.json()
    assert response.status_code == 200
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, user_service: UserService):
    user_in = UserCreate(
        email="api_logout@example.com",
        username="api_logoutuser",
        password="password123",
    )
    await user_service.create_user(user_in)
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "api_logout@example.com", "password": "password123"},
    )
    login_data = login_response.json()
    assert login_response.status_code == 200
    assert "refresh_token" in login_data
    refresh_token = login_data["refresh_token"]

    response = await client.post(
        "/api/v1/auth/logout", json={"refresh_token": refresh_token}
    )
    data = response.json()
    assert response.status_code == 200
    assert "message" in data
    assert data["message"] == "Successfully logged out"


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, user_service: UserService):
    user_in = UserCreate(
        email="me@example.com", username="meuser", password="password123"
    )
    await user_service.create_user(user_in)

    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "me@example.com", "password": "password123"},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@example.com"
    assert data["username"] == "meuser"


@pytest.mark.asyncio
async def test_register(client: AsyncClient):
    user_in = {
        "email": "new_user@example.com",
        "username": "new_user",
        "password": "password123",
    }
    response = await client.post("/api/v1/auth/register", json=user_in)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == user_in["email"]
    assert data["username"] == user_in["username"]
    assert "id" in data
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_register_existing_email(client: AsyncClient, user_service: UserService):
    user_in = UserCreate(
        email="existing@example.com", username="existing", password="password123"
    )
    await user_service.create_user(user_in)

    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "existing@example.com",
            "username": "new_existing",
            "password": "password123",
        },
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]
