from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.enums import CompletionStatus, ResourceType
from app.domain.schemas.resource import ResourceCreate
from app.domain.schemas.section import SectionCreate
from app.domain.schemas.study_plan import StudyPlanCreate
from app.domain.schemas.user import UserCreate
from app.domain.services.progress import ProgressService
from app.domain.services.study_plan import StudyPlanService
from app.domain.services.user import UserService
from app.persistence.repository.progress import ProgressRepository
from app.persistence.repository.section import SectionRepository
from app.persistence.repository.study_plan import StudyPlanRepository


@pytest.fixture
def progress_service(session: AsyncSession):
    return ProgressService(
        ProgressRepository(session),
        StudyPlanRepository(session),
        SectionRepository(session),
    )


@pytest.mark.asyncio
async def test_progress_flow(
    progress_service: ProgressService,
    study_plan_service: StudyPlanService,
    user_service: UserService,
):
    # 1. Create User
    user = await user_service.create_user(
        UserCreate(email="prog@test.com", username="prog", password="password123")
    )

    # 2. Create Plan with Sections and Resources
    plan_in = StudyPlanCreate(
        title="Prog Plan",
        description="Test",
        user_id=user.id,
        sections=[
            SectionCreate(
                title="S1",
                resources=[
                    ResourceCreate(
                        title="R1", url="http://r1", type=ResourceType.ARTICLE
                    ),
                    ResourceCreate(
                        title="R2", url="http://r2", type=ResourceType.ARTICLE
                    ),
                ],
            )
        ],
    )
    plan = await study_plan_service.create_study_plan(plan_in)
    section = plan.sections[0]
    r1 = section.resources[0]
    r2 = section.resources[1]

    # 3. Initialize Progress
    sp_progress = await progress_service.initialize_study_plan_progress(
        user.id, plan.id
    )
    assert sp_progress.status == CompletionStatus.NOT_STARTED
    assert sp_progress.progress == 0.0

    # 4. Complete R1
    # We need to find the section_id and resource_id
    # Note: create_study_plan returns StudyPlanReadDetail which has IDs

    rp1 = await progress_service.update_resource_status(
        user.id, plan.id, section.id, r1.id, CompletionStatus.COMPLETED
    )
    assert rp1.status == CompletionStatus.COMPLETED

    # 5. Check Section Progress
    # S1 has 2 resources. 1 completed. Progress should be 0.5
    sec_progress = await progress_service.progress_repo.get_section_progress(
        user.id, section.id
    )
    assert sec_progress is not None
    assert sec_progress.progress == 0.5
    assert sec_progress.status == CompletionStatus.IN_PROGRESS

    # 6. Check Plan Progress
    # Plan has 1 section. Section is 0.5 done. Plan progress should be 0.5
    sp_progress = await progress_service.progress_repo.get_study_plan_progress(
        user.id, plan.id
    )
    assert sp_progress is not None
    assert sp_progress.progress == 0.5
    assert sp_progress.status == CompletionStatus.IN_PROGRESS

    # 7. Complete R2
    await progress_service.update_resource_status(
        user.id, plan.id, section.id, r2.id, CompletionStatus.COMPLETED
    )

    # 8. Check Completion
    sec_progress = await progress_service.progress_repo.get_section_progress(
        user.id, section.id
    )
    assert sec_progress is not None
    assert sec_progress.progress == 1.0
    assert sec_progress.status == CompletionStatus.COMPLETED

    sp_progress = await progress_service.progress_repo.get_study_plan_progress(
        user.id, plan.id
    )
    assert sp_progress is not None
    assert sp_progress.progress == 1.0
    assert sp_progress.status == CompletionStatus.COMPLETED


@pytest.mark.asyncio
async def test_nested_section_progress(
    progress_service: ProgressService,
    study_plan_service: StudyPlanService,
    user_service: UserService,
):
    # 1. Create User
    user = await user_service.create_user(
        UserCreate(email="nested@test.com", username="nested", password="password123")
    )

    # 2. Create Nested Plan
    # Plan -> S1 -> R1
    #            -> S1.1 -> R2
    plan_in = StudyPlanCreate(
        title="Nested Plan",
        description="Test Nested",
        user_id=user.id,
        sections=[
            SectionCreate(
                title="S1",
                resources=[
                    ResourceCreate(
                        title="R1", url="http://r1", type=ResourceType.ARTICLE
                    )
                ],
                children=[
                    SectionCreate(
                        title="S1.1",
                        resources=[
                            ResourceCreate(
                                title="R2", url="http://r2", type=ResourceType.ARTICLE
                            )
                        ],
                    )
                ],
            )
        ],
    )
    plan = await study_plan_service.create_study_plan(plan_in)

    s1 = plan.sections[0]
    r1 = s1.resources[0]
    s1_1 = s1.children[0]
    r2 = s1_1.resources[0]

    # 3. Initialize
    await progress_service.initialize_study_plan_progress(user.id, plan.id)

    # 4. Complete R2 (Child section resource)
    await progress_service.update_resource_status(
        user.id, plan.id, s1_1.id, r2.id, CompletionStatus.COMPLETED
    )

    # Check S1.1 Progress (Should be 100%)
    sp_1_1 = await progress_service.progress_repo.get_section_progress(user.id, s1_1.id)
    assert sp_1_1 is not None
    assert sp_1_1.progress == 1.0
    assert sp_1_1.status == CompletionStatus.COMPLETED

    # Check S1 Progress
    # S1 has 1 Resource (R1 - 0%) and 1 Child (S1.1 - 100%)
    # Total items = 2. Score = 0 + 1 = 1. Progress = 0.5
    sp_1 = await progress_service.progress_repo.get_section_progress(user.id, s1.id)
    assert sp_1 is not None
    assert sp_1.progress == 0.5
    assert sp_1.status == CompletionStatus.IN_PROGRESS

    # Check Plan Progress
    # Plan has 1 top level section (S1 - 50%)
    # Progress = 0.5
    pp = await progress_service.progress_repo.get_study_plan_progress(user.id, plan.id)
    assert pp is not None
    assert pp.progress == 0.5

    # 5. Complete R1 (Parent section resource)
    await progress_service.update_resource_status(
        user.id, plan.id, s1.id, r1.id, CompletionStatus.COMPLETED
    )

    # Check S1 Progress (Should be 100%)
    sp_1 = await progress_service.progress_repo.get_section_progress(user.id, s1.id)
    assert sp_1 is not None
    assert sp_1.progress == 1.0
    assert sp_1.status == CompletionStatus.COMPLETED

    # Check Plan Progress (Should be 100%)
    pp = await progress_service.progress_repo.get_study_plan_progress(user.id, plan.id)
    assert pp is not None
    assert pp.progress == 1.0
    assert pp.status == CompletionStatus.COMPLETED


@pytest.mark.asyncio
async def test_revert_progress(
    progress_service: ProgressService,
    study_plan_service: StudyPlanService,
    user_service: UserService,
):
    user = await user_service.create_user(
        UserCreate(email="revert@test.com", username="revert", password="password123")
    )
    plan_in = StudyPlanCreate(
        title="Revert Plan",
        description="Test",
        user_id=user.id,
        sections=[
            SectionCreate(
                title="S1",
                resources=[
                    ResourceCreate(title="R1", url="u", type=ResourceType.ARTICLE)
                ],
            )
        ],
    )
    plan = await study_plan_service.create_study_plan(plan_in)
    s1 = plan.sections[0]
    r1 = s1.resources[0]

    await progress_service.initialize_study_plan_progress(user.id, plan.id)

    # Complete
    await progress_service.update_resource_status(
        user.id, plan.id, s1.id, r1.id, CompletionStatus.COMPLETED
    )
    sp = await progress_service.progress_repo.get_section_progress(user.id, s1.id)
    assert sp is not None
    assert sp.progress == 1.0

    # Revert
    await progress_service.update_resource_status(
        user.id, plan.id, s1.id, r1.id, CompletionStatus.NOT_STARTED
    )
    sp = await progress_service.progress_repo.get_section_progress(user.id, s1.id)
    assert sp is not None
    assert sp.progress == 0.0
    assert sp.status == CompletionStatus.NOT_STARTED


@pytest.mark.asyncio
async def test_progress_error_cases(
    progress_service: ProgressService,
    study_plan_service: StudyPlanService,
    user_service: UserService,
):
    user = await user_service.create_user(
        UserCreate(email="err@test.com", username="err", password="password123")
    )
    plan_in = StudyPlanCreate(
        title="Err Plan",
        description="Test",
        user_id=user.id,
        sections=[
            SectionCreate(
                title="S1",
                resources=[
                    ResourceCreate(title="R1", url="u", type=ResourceType.ARTICLE)
                ],
            )
        ],
    )
    plan = await study_plan_service.create_study_plan(plan_in)
    s1 = plan.sections[0]
    r1 = s1.resources[0]

    # 1. Update without initialization (should auto-initialize)
    # The service calls initialize_study_plan_progress internally, so this should pass
    await progress_service.update_resource_status(
        user.id, plan.id, s1.id, r1.id, CompletionStatus.COMPLETED
    )

    # 2. Invalid Resource ID
    with pytest.raises(ValueError, match="Resource progress not found"):
        await progress_service.update_resource_status(
            user.id, plan.id, s1.id, uuid4(), CompletionStatus.COMPLETED
        )

    # 3. Invalid Section ID
    with pytest.raises(ValueError, match="Section progress not found"):
        await progress_service.update_resource_status(
            user.id, plan.id, uuid4(), r1.id, CompletionStatus.COMPLETED
        )
