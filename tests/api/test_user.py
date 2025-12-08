import pytest
from httpx import AsyncClient

from app.domain.schemas.user import UserCreate
from app.domain.services.user import UserService


@pytest.mark.asyncio
async def test_search_users(client: AsyncClient, user_service: UserService):
    # Create some users
    await user_service.create_user(
        UserCreate(email="alice@example.com", username="alice", password="password123")
    )
    await user_service.create_user(
        UserCreate(email="bob@example.com", username="bob", password="password123")
    )
    await user_service.create_user(
        UserCreate(
            email="charlie@example.com", username="charlie", password="password123"
        )
    )

    # Test list all
    response = await client.get("/api/v1/users/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    usernames = {u["username"] for u in data}
    assert "alice" in usernames
    assert "bob" in usernames
    assert "charlie" in usernames

    # Test search by username
    response = await client.get("/api/v1/users/?username=ali")
    assert response.status_code == 200
    data = response.json()
    # Should find alice
    assert any(u["username"] == "alice" for u in data)
    # Should not find bob
    assert not any(u["username"] == "bob" for u in data)
