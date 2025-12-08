from uuid import uuid4

import pytest

from app.domain.enums import ResourceType
from app.domain.schemas.resource import ResourceCreate
from app.domain.schemas.section import SectionCreate
from app.domain.schemas.study_plan import StudyPlanCreate
from app.domain.schemas.user import UserCreate
from app.domain.services.study_plan import StudyPlanService
from app.domain.services.user import UserService


@pytest.fixture
async def user(user_service: UserService):
    user_in = UserCreate(
        email="studyplan@example.com", username="studyplanuser", password="password123"
    )
    return await user_service.create_user(user_in)


@pytest.mark.asyncio
async def test_create_study_plan_simple(study_plan_service: StudyPlanService, user):
    plan_in = StudyPlanCreate(
        title="Simple Plan", description="A simple plan", user_id=user.id
    )
    plan = await study_plan_service.create_study_plan(plan_in)

    assert plan.id is not None
    assert plan.title == "Simple Plan"
    assert plan.user_id == user.id
    assert len(plan.sections) == 0
    assert len(plan.resources) == 0


@pytest.mark.asyncio
async def test_create_study_plan_nested(study_plan_service: StudyPlanService, user):
    plan_in = StudyPlanCreate(
        title="Nested Plan",
        description="A nested plan",
        user_id=user.id,
        resources=[
            ResourceCreate(title="R1", url="http://r1.com", type=ResourceType.ARTICLE)
        ],
        sections=[
            SectionCreate(
                title="S1",
                resources=[
                    ResourceCreate(
                        title="R2", url="http://r2.com", type=ResourceType.VIDEO
                    )
                ],
                children=[
                    SectionCreate(
                        title="S1.1",
                        resources=[
                            ResourceCreate(
                                title="R3",
                                url="http://r3.com",
                                type=ResourceType.DOCUMENTATION,
                            )
                        ],
                    )
                ],
            )
        ],
    )
    plan = await study_plan_service.create_study_plan(plan_in)

    assert plan.title == "Nested Plan"
    assert len(plan.resources) == 1
    assert plan.resources[0].title == "R1"

    assert len(plan.sections) == 1
    s1 = plan.sections[0]
    assert s1.title == "S1"
    assert len(s1.resources) == 1
    assert s1.resources[0].title == "R2"

    assert len(s1.children) == 1
    s1_1 = s1.children[0]
    assert s1_1.title == "S1.1"
    assert len(s1_1.resources) == 1
    assert s1_1.resources[0].title == "R3"


@pytest.mark.asyncio
async def test_get_user_study_plans(study_plan_service: StudyPlanService, user):
    # Create 3 plans
    for i in range(3):
        await study_plan_service.create_study_plan(
            StudyPlanCreate(title=f"Plan {i}", description="desc", user_id=user.id)
        )

    plans, total = await study_plan_service.get_user_study_plans(user.id)
    assert total == 3
    assert len(plans) == 3
    assert {p.title for p in plans} == {"Plan 0", "Plan 1", "Plan 2"}


@pytest.mark.asyncio
async def test_get_study_plan_by_id_success(study_plan_service: StudyPlanService, user):
    created = await study_plan_service.create_study_plan(
        StudyPlanCreate(title="Target", description="desc", user_id=user.id)
    )

    fetched = await study_plan_service.get_study_plan_by_id(created.id)
    assert fetched is not None
    assert fetched.id == created.id
    assert fetched.title == "Target"


@pytest.mark.asyncio
async def test_get_study_plan_by_id_not_found(
    study_plan_service: StudyPlanService,
):
    fetched = await study_plan_service.get_study_plan_by_id(uuid4())
    assert fetched is None
