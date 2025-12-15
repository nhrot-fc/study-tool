import pytest
from httpx import AsyncClient

from app.domain.schemas.user import UserCreate
from app.domain.services.user import UserService


@pytest.mark.asyncio
async def test_create_study_plan(client: AsyncClient, user_service: UserService):
    # Create user and login
    user_in = UserCreate(
        email="plan_creator@example.com", username="plancreator", password="password123"
    )
    user_data = await user_service.create_user(user_in)

    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "plan_creator@example.com", "password": "password123"},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Study Plan
    plan_data = {
        "title": "My Awesome Plan",
        "description": "Learning Python",
        "user_id": str(user_data.id),
        "resources": [
            {
                "title": "Python Docs",
                "url": "https://docs.python.org",
                "type": "documentation",
            }
        ],
        "sections": [
            {
                "title": "Basics",
                "description": "Variables and types",
                "order": 1,
                "resources": [],
                "children": [],
            }
        ],
    }

    response = await client.post("/api/v1/plan/", json=plan_data, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "My Awesome Plan"
    assert len(data["resources"]) == 1
    assert len(data["sections"]) == 1
    assert data["sections"][0]["title"] == "Basics"


@pytest.mark.asyncio
async def test_get_study_plan_detail(client: AsyncClient, user_service: UserService):
    # Create user and login
    user_in = UserCreate(
        email="plan_viewer@example.com", username="planviewer", password="password123"
    )
    user_data = await user_service.create_user(user_in)

    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "plan_viewer@example.com", "password": "password123"},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create a plan
    plan_data = {
        "title": "Detailed Plan",
        "description": "Desc",
        "user_id": str(user_data.id),
        "sections": [{"title": "S1"}],
    }
    create_res = await client.post("/api/v1/plan/", json=plan_data, headers=headers)
    plan_id = create_res.json()["id"]

    # Get detail
    response = await client.get(f"/api/v1/plan/{plan_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Detailed Plan"
    assert len(data["sections"]) == 1


@pytest.mark.asyncio
async def test_fork_study_plan(client: AsyncClient, user_service: UserService):
    # User 1 creates a plan
    user1_in = UserCreate(email="u1@example.com", username="u1", password="password123")
    user1_data = await user_service.create_user(user1_in)
    login1 = await client.post(
        "/api/v1/auth/login",
        json={"email": "u1@example.com", "password": "password123"},
    )
    token1 = login1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    plan_data = {
        "title": "Original",
        "description": "Desc",
        "user_id": str(user1_data.id),
        "sections": [{"title": "S1"}],
    }
    create_res = await client.post("/api/v1/plan/", json=plan_data, headers=headers1)
    plan_id = create_res.json()["id"]

    # User 2 forks the plan
    user2_in = UserCreate(email="u2@example.com", username="u2", password="password123")
    await user_service.create_user(user2_in)
    login2 = await client.post(
        "/api/v1/auth/login",
        json={"email": "u2@example.com", "password": "password123"},
    )
    token2 = login2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    fork_res = await client.post(f"/api/v1/plan/{plan_id}/fork", headers=headers2)
    assert fork_res.status_code == 201
    fork_data = fork_res.json()
    assert fork_data["title"] == "Copy of Original"
    assert fork_data["description"] == "Desc"
    assert len(fork_data["sections"]) == 1
    assert fork_data["sections"][0]["title"] == "S1"
    assert fork_data["id"] != plan_id
    assert fork_data["forked_from_id"] == plan_id


@pytest.mark.asyncio
async def test_list_user_study_plans_by_user_id(
    client: AsyncClient, user_service: UserService
):
    # User 1 creates a plan
    user1_in = UserCreate(
        email="target@example.com", username="targetuser", password="password123"
    )
    user_data = await user_service.create_user(user1_in)
    login1 = await client.post(
        "/api/v1/auth/login",
        json={"email": "target@example.com", "password": "password123"},
    )
    token1 = login1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    await client.post(
        "/api/v1/plan/",
        json={
            "title": "Target Plan",
            "description": "Desc",
            "user_id": str(user_data.id),
        },
        headers=headers1,
    )

    # User 2 views User 1's plans
    user2_in = UserCreate(
        email="viewer@example.com", username="viewer", password="password123"
    )
    await user_service.create_user(user2_in)
    login2 = await client.post(
        "/api/v1/auth/login",
        json={"email": "viewer@example.com", "password": "password123"},
    )
    token2 = login2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    response = await client.get(f"/api/v1/plan/user/{user_data.id}", headers=headers2)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Target Plan"


@pytest.mark.asyncio
async def test_update_study_plan_endpoint(
    client: AsyncClient, user_service: UserService
):
    # 1. Create User
    user_in = UserCreate(
        email="updater@example.com", username="updater", password="password123"
    )
    user = await user_service.create_user(user_in)

    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "updater@example.com", "password": "password123"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Plan
    plan_data = {
        "title": "Original",
        "description": "Desc",
        "user_id": str(user.id),
        "sections": [{"title": "S1", "resources": []}],
    }
    create_res = await client.post("/api/v1/plan/", json=plan_data, headers=headers)
    plan_id = create_res.json()["id"]
    s1_id = create_res.json()["sections"][0]["id"]

    # 3. Update Plan
    update_data = {
        "title": "Updated",
        "sections": [
            {"id": s1_id, "title": "S1 Updated", "resources": []},
            {"title": "S2 New", "resources": []},
        ],
    }

    update_res = await client.put(
        f"/api/v1/plan/{plan_id}", json=update_data, headers=headers
    )

    assert update_res.status_code == 200
    data = update_res.json()
    assert data["title"] == "Updated"
    assert len(data["sections"]) == 2

    titles = {s["title"] for s in data["sections"]}
    assert "S1 Updated" in titles
    assert "S2 New" in titles


@pytest.mark.asyncio
async def test_create_study_plan_too_deep(
    client: AsyncClient, user_service: UserService
):
    # Create user and login
    user_in = UserCreate(
        email="deep_plan@example.com", username="deepplan", password="password123"
    )
    user_data = await user_service.create_user(user_in)

    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "deep_plan@example.com", "password": "password123"},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create a 6-level nested structure
    # Level 1
    section = {"title": "L1", "children": []}
    current = section

    # Add 5 more levels (total 6)
    for i in range(2, 7):
        child = {"title": f"L{i}", "children": []}
        current["children"].append(child)
        current = child

    plan_data = {
        "title": "Too Deep Plan",
        "description": "A plan that is too deep",
        "user_id": str(user_data.id),
        "sections": [section],
    }

    response = await client.post("/api/v1/plan/", json=plan_data, headers=headers)
    assert response.status_code == 400
    assert "Maximum section nesting depth of 5 exceeded" in response.json()["detail"]
