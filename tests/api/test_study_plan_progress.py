import pytest
from httpx import AsyncClient

from app.domain.schemas.user import UserCreate
from app.domain.services.user import UserService


@pytest.mark.asyncio
async def test_api_complex_progress_updates(
    client: AsyncClient, user_service: UserService
):
    # 1. Create User and Login
    user_in = UserCreate(
        email="api_complex@test.com", username="apicomplex", password="password123"
    )
    user = await user_service.create_user(user_in)

    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "api_complex@test.com", "password": "password123"},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Complex Plan
    plan_data = {
        "title": "API Complex Plan",
        "description": "Testing nested progress via API",
        "user_id": str(user.id),
        "sections": [
            {
                "title": "S1",
                "resources": [{"title": "R1", "url": "http://r1", "type": "article"}],
                "children": [
                    {
                        "title": "S2",
                        "resources": [
                            {"title": "R2", "url": "http://r2", "type": "article"}
                        ],
                        "children": [
                            {
                                "title": "S3",
                                "resources": [
                                    {
                                        "title": "R3",
                                        "url": "http://r3",
                                        "type": "article",
                                    }
                                ],
                                "children": [],
                            }
                        ],
                    }
                ],
            }
        ],
        "resources": [],
    }

    create_res = await client.post(
        "/api/v1/plan/", json=plan_data, headers=headers
    )
    assert create_res.status_code == 201
    plan_id = create_res.json()["id"]

    # Get IDs from response
    s1_data = create_res.json()["sections"][0]
    s1_id = s1_data["id"]
    r1_id = s1_data["resources"][0]["id"]

    s2_data = s1_data["children"][0]
    s2_id = s2_data["id"]
    r2_id = s2_data["resources"][0]["id"]

    s3_data = s2_data["children"][0]
    s3_id = s3_data["id"]
    r3_id = s3_data["resources"][0]["id"]

    assert s1_id is not None
    assert s2_id is not None
    assert s3_id is not None
    assert r1_id is not None
    assert r2_id is not None
    assert r3_id is not None
    # 3. Get Plan (Initializes Progress)
    get_res = await client.get(f"/api/v1/plan/{plan_id}", headers=headers)
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["progress"] is not None
    assert data["progress"]["progress"] == 0.0

    # 4. Complete R3 (Deepest)
    status_update = {"status": "completed"}
    update_res = await client.post(
        f"/api/v1/progress/plan/{plan_id}/sections/{s3_id}/resources/{r3_id}/status",
        json=status_update,
        headers=headers,
    )
    assert update_res.status_code == 200

    # 5. Verify Progress via Get Plan
    get_res = await client.get(f"/api/v1/plan/{plan_id}", headers=headers)
    data = get_res.json()

    # Plan Progress: S1 (0.25) -> Plan (0.25)
    assert data["progress"]["progress"] == 0.25

    # Check Section Progresses in the response if available,
    # or we can check via the progress structure if it's returned fully.
    # The StudyPlanProgressRead schema includes section_progresses list.
    # We need to find the right section progress in the list.
    section_progresses = data["progress"]["section_progresses"]

    # Helper to find progress by section_id
    def get_sp(sec_id):
        for sp in section_progresses:
            if sp["section_id"] == sec_id:
                return sp
        return None

    s3_prog = get_sp(s3_id)
    assert s3_prog is not None
    assert s3_prog["progress"] == 1.0

    s2_prog = get_sp(s2_id)
    assert s2_prog is not None
    assert s2_prog["progress"] == 0.5

    s1_prog = get_sp(s1_id)
    assert s1_prog is not None
    assert s1_prog["progress"] == 0.25


@pytest.mark.asyncio
async def test_api_get_plan_authenticated_vs_anonymous(
    client: AsyncClient, user_service: UserService
):
    # 1. Create User (Owner)
    owner_in = UserCreate(
        email="owner@test.com", username="owner", password="password123"
    )
    owner = await user_service.create_user(owner_in)

    # Login as owner to create plan
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "owner@test.com", "password": "password123"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Plan
    plan_data = {
        "title": "Public Plan",
        "description": "For everyone",
        "user_id": str(owner.id),
        "sections": [{"title": "S1", "resources": [], "children": []}],
        "resources": [],
    }
    create_res = await client.post(
        "/api/v1/plan/", json=plan_data, headers=headers
    )
    plan_id = create_res.json()["id"]

    # 3. Get Plan as Anonymous (No Auth Header)
    anon_res = await client.get(f"/api/v1/plan/{plan_id}")
    assert anon_res.status_code == 200
    anon_data = anon_res.json()
    assert anon_data["title"] == "Public Plan"
    assert anon_data["progress"] is None

    # 4. Get Plan as Authenticated User (Owner)
    auth_res = await client.get(f"/api/v1/plan/{plan_id}", headers=headers)
    assert auth_res.status_code == 200
    auth_data = auth_res.json()
    assert auth_data["title"] == "Public Plan"
    assert auth_data["progress"] is not None
    assert auth_data["progress"]["user_id"] == str(owner.id)

    # 5. Get Plan as Another Authenticated User
    other_in = UserCreate(
        email="other@test.com", username="other", password="password123"
    )
    other = await user_service.create_user(other_in)

    login_other = await client.post(
        "/api/v1/auth/login",
        json={"email": "other@test.com", "password": "password123"},
    )
    token_other = login_other.json()["access_token"]
    headers_other = {"Authorization": f"Bearer {token_other}"}

    other_res = await client.get(
        f"/api/v1/plan/{plan_id}", headers=headers_other
    )
    assert other_res.status_code == 200
    other_data = other_res.json()
    assert other_data["progress"] is not None
    assert other_data["progress"]["user_id"] == str(other.id)
    # Should be a new progress record, initially 0
    assert other_data["progress"]["progress"] == 0.0
