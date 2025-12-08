from unittest.mock import MagicMock

import pytest
from httpx import AsyncClient

from app.core.dependencies import get_gemini_service
from app.domain.schemas.section import SectionCreate
from app.domain.schemas.study_plan import StudyPlanProposal
from app.domain.schemas.user import UserCreate
from app.domain.services.user import UserService
from app.main import app

# Mock Gemini Service
mock_gemini_service = MagicMock()

# Mock Gemini Service
mock_gemini_service = MagicMock()
dummy_proposal = StudyPlanProposal(
    title="Generated Plan",
    description="Generated Description",
    sections=[
        SectionCreate(
            title="Section 1",
            description="Description for section 1",
            order=1,
            children=[],
            resources=[],
        )
    ],
    resources=[],
)
mock_gemini_service.generate_study_plan_proposal.return_value = dummy_proposal


@pytest.fixture(autouse=True)
def override_gemini_service():
    app.dependency_overrides[get_gemini_service] = lambda: mock_gemini_service
    yield
    app.dependency_overrides = {}


@pytest.mark.asyncio
async def test_generate_study_plan(client: AsyncClient, user_service: UserService):
    # Create user and login
    user_in = UserCreate(
        email="generator@example.com", username="generator", password="password123"
    )
    await user_service.create_user(user_in)

    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "generator@example.com", "password": "password123"},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Generate Plan
    generate_data = {"topic": "Python", "level": "Beginner"}

    response = await client.post(
        "/api/v1/study-plans/generate", json=generate_data, headers=headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Generated Plan"
    assert len(data["sections"]) == 1
    assert data["sections"][0]["title"] == "Section 1"

    # Verify mock was called
    mock_gemini_service.generate_study_plan_proposal.assert_called()
