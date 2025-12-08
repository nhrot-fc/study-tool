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
    await user_service.create_user(user_in)

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

    response = await client.post(
        "/api/v1/study-plans/", json=plan_data, headers=headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "My Awesome Plan"
    assert len(data["resources"]) == 1
    assert len(data["sections"]) == 1
    assert data["sections"][0]["title"] == "Basics"


@pytest.mark.asyncio
async def test_list_study_plans(client: AsyncClient, user_service: UserService):
    # Create user and login
    user_in = UserCreate(
        email="plan_lister@example.com", username="planlister", password="password123"
    )
    await user_service.create_user(user_in)

    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "plan_lister@example.com", "password": "password123"},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create a plan first
    plan_data = {"title": "Plan 1", "description": "Desc 1"}
    await client.post("/api/v1/study-plans/", json=plan_data, headers=headers)

    # List plans
    response = await client.get("/api/v1/study-plans/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Plan 1"


@pytest.mark.asyncio
async def test_get_study_plan_detail(client: AsyncClient, user_service: UserService):
    # Create user and login
    user_in = UserCreate(
        email="plan_viewer@example.com", username="planviewer", password="password123"
    )
    await user_service.create_user(user_in)

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
        "sections": [{"title": "S1"}],
    }
    create_res = await client.post(
        "/api/v1/study-plans/", json=plan_data, headers=headers
    )
    plan_id = create_res.json()["id"]

    # Get detail
    response = await client.get(f"/api/v1/study-plans/{plan_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Detailed Plan"
    assert len(data["sections"]) == 1
