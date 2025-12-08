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
        "/api/v1/login",
        json={"email": "api_login@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    response = await client.post(
        "/api/v1/login", json={"email": "wrong@example.com", "password": "wrong"}
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
        "/api/v1/login",
        json={"email": "api_refresh@example.com", "password": "password123"},
    )
    refresh_token = login_response.json()["refresh_token"]

    response = await client.post(
        "/api/v1/refresh", json={"refresh_token": refresh_token}
    )
    assert response.status_code == 200
    data = response.json()
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
        "/api/v1/login",
        json={"email": "api_logout@example.com", "password": "password123"},
    )
    refresh_token = login_response.json()["refresh_token"]

    response = await client.post(
        "/api/v1/logout", json={"refresh_token": refresh_token}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"
