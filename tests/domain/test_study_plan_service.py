from uuid import uuid4

import pytest

from app.domain.enums import ResourceType
from app.domain.schemas.resource import ResourceCreate, ResourceUpsert
from app.domain.schemas.section import SectionCreate, SectionUpsert
from app.domain.schemas.study_plan import StudyPlanCreate, StudyPlanUpdate
from app.domain.schemas.user import UserCreate
from app.domain.services.progress import ProgressService
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


@pytest.mark.asyncio
async def test_create_study_plan_deeply_nested(
    study_plan_service: StudyPlanService, user
):
    # Create a 5-level nested structure
    # Level 5
    s5 = SectionCreate(title="Level 5")
    # Level 4
    s4 = SectionCreate(title="Level 4", children=[s5])
    # Level 3
    s3 = SectionCreate(title="Level 3", children=[s4])
    # Level 2
    s2 = SectionCreate(title="Level 2", children=[s3])
    # Level 1
    s1 = SectionCreate(title="Level 1", children=[s2])

    plan_in = StudyPlanCreate(
        title="Deep Plan",
        description="Deeply nested plan",
        user_id=user.id,
        sections=[s1],
    )

    created_plan = await study_plan_service.create_study_plan(plan_in)

    # Fetch again to ensure persistence and retrieval works
    fetched_plan = await study_plan_service.get_study_plan_by_id(created_plan.id)

    assert fetched_plan is not None
    assert len(fetched_plan.sections) == 1

    # Verify levels
    l1 = fetched_plan.sections[0]
    assert l1.title == "Level 1"
    assert len(l1.children) == 1

    l2 = l1.children[0]
    assert l2.title == "Level 2"
    assert len(l2.children) == 1

    l3 = l2.children[0]
    assert l3.title == "Level 3"
    assert len(l3.children) == 1

    l4 = l3.children[0]
    assert l4.title == "Level 4"
    assert len(l4.children) == 1

    l5 = l4.children[0]
    assert l5.title == "Level 5"
    assert len(l5.children) == 0


@pytest.mark.asyncio
async def test_create_study_plan_exceeds_depth(
    study_plan_service: StudyPlanService, user
):
    # Create a 6-level nested structure
    # Level 1
    section = SectionCreate(title="L1", children=[])
    current = section

    # Add 5 more levels (total 6)
    for i in range(2, 7):
        child = SectionCreate(title=f"L{i}", children=[])
        current.children.append(child)
        current = child

    plan_in = StudyPlanCreate(
        title="Too Deep Plan",
        description="A plan that is too deep",
        user_id=user.id,
        sections=[section],
    )

    with pytest.raises(ValueError, match="Maximum section nesting depth of 5 exceeded"):
        await study_plan_service.create_study_plan(plan_in)


@pytest.mark.asyncio
async def test_create_study_plan_max_depth(study_plan_service: StudyPlanService, user):
    # Create a 5-level nested structure (should pass)
    # Level 1
    section = SectionCreate(title="L1", children=[])
    current = section

    # Add 4 more levels (total 5)
    for i in range(2, 6):
        child = SectionCreate(title=f"L{i}", children=[])
        current.children.append(child)
        current = child

    plan_in = StudyPlanCreate(
        title="Max Depth Plan",
        description="A plan that is exactly 5 levels deep",
        user_id=user.id,
        sections=[section],
    )

    plan = await study_plan_service.create_study_plan(plan_in)
    assert plan is not None
    assert len(plan.sections) == 1
    # Verify depth
    s = plan.sections[0]
    depth = 1
    while s.children:
        s = s.children[0]
        depth += 1
    assert depth == 5


@pytest.mark.asyncio
async def test_update_study_plan(
    study_plan_service: StudyPlanService,
    progress_service: ProgressService,
    user,
):
    # 1. Create initial plan
    plan_in = StudyPlanCreate(
        title="Original Plan",
        description="Original Desc",
        user_id=user.id,
        sections=[
            SectionCreate(
                title="S1",
                resources=[
                    ResourceCreate(title="R1", url="http://r1", type=ResourceType.ARTICLE)
                ],
            )
        ],
    )
    plan = await study_plan_service.create_study_plan(plan_in)
    
    # Initialize progress
    await progress_service.initialize_study_plan_progress(user.id, plan.id)

    # 2. Update Plan
    # Change title, modify S1 (change title), add S2
    s1_id = plan.sections[0].id
    r1_id = plan.sections[0].resources[0].id
    
    update_in = StudyPlanUpdate(
        title="Updated Plan",
        sections=[
            SectionUpsert(
                id=s1_id,
                title="S1 Updated",
                resources=[
                    ResourceUpsert(
                        id=r1_id,
                        title="R1",
                        url="http://r1",
                        type=ResourceType.ARTICLE
                    )
                ]
            ),
            SectionUpsert(
                title="S2",
                resources=[
                    ResourceUpsert(
                        title="R2",
                        url="http://r2",
                        type=ResourceType.VIDEO
                    )
                ]
            )
        ]
    )

    updated_plan = await study_plan_service.update_study_plan(
        plan.id, update_in, progress_service
    )

    assert updated_plan.title == "Updated Plan"
    assert len(updated_plan.sections) == 2
    
    s1 = next(s for s in updated_plan.sections if s.id == s1_id)
    assert s1.title == "S1 Updated"
    
    s2 = next(s for s in updated_plan.sections if s.id != s1_id)
    assert s2.title == "S2"
    assert len(s2.resources) == 1
    assert s2.resources[0].title == "R2"

