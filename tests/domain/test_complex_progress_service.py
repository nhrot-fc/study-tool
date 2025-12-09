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
async def test_complex_nested_progress(
    progress_service: ProgressService,
    study_plan_service: StudyPlanService,
    user_service: UserService,
):
    # 1. Create User
    user = await user_service.create_user(
        UserCreate(email="complex@test.com", username="complex", password="password123")
    )

    # 2. Create Complex Plan (3 levels)
    # S1 -> R1, S2
    #       S2 -> R2, S3
    #             S3 -> R3
    plan_in = StudyPlanCreate(
        title="Complex Plan",
        description="Testing nested progress",
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
                        title="S2",
                        resources=[
                            ResourceCreate(
                                title="R2", url="http://r2", type=ResourceType.ARTICLE
                            )
                        ],
                        children=[
                            SectionCreate(
                                title="S3",
                                resources=[
                                    ResourceCreate(
                                        title="R3",
                                        url="http://r3",
                                        type=ResourceType.ARTICLE,
                                    )
                                ],
                            )
                        ],
                    )
                ],
            )
        ],
    )
    plan = await study_plan_service.create_study_plan(plan_in)

    # Retrieve IDs
    s1 = plan.sections[0]
    r1 = s1.resources[0]
    s2 = s1.children[0]
    r2 = s2.resources[0]
    s3 = s2.children[0]
    r3 = s3.resources[0]

    # 3. Initialize Progress
    await progress_service.initialize_study_plan_progress(user.id, plan.id)

    # 4. Complete R3 (Deepest level)
    # S3 has 1 resource (R3). Progress should become 1.0
    await progress_service.update_resource_status(
        user.id, plan.id, s3.id, r3.id, CompletionStatus.COMPLETED
    )

    # Verify S3 Progress
    s3_prog = await progress_service.progress_repo.get_section_progress(user.id, s3.id)
    assert s3_prog is not None
    assert s3_prog.progress == 1.0
    assert s3_prog.status == CompletionStatus.COMPLETED

    # Verify S2 Progress
    # S2 has R2 (0.0) and S3 (1.0). Total items = 2. Progress = 0.5
    s2_prog = await progress_service.progress_repo.get_section_progress(user.id, s2.id)
    assert s2_prog is not None
    assert s2_prog.progress == 0.5
    assert s2_prog.status == CompletionStatus.IN_PROGRESS

    # Verify S1 Progress
    # S1 has R1 (0.0) and S2 (0.5). Total items = 2. Progress = 0.25
    s1_prog = await progress_service.progress_repo.get_section_progress(user.id, s1.id)
    assert s1_prog is not None
    assert s1_prog.progress == 0.25
    assert s1_prog.status == CompletionStatus.IN_PROGRESS

    # Verify Plan Progress
    # Plan has S1 (0.25). Progress = 0.25
    sp_prog = await progress_service.progress_repo.get_study_plan_progress(
        user.id, plan.id
    )
    assert sp_prog is not None
    assert sp_prog.progress == 0.25
    assert sp_prog.status == CompletionStatus.IN_PROGRESS

    # 5. Complete R2 (Middle level)
    await progress_service.update_resource_status(
        user.id, plan.id, s2.id, r2.id, CompletionStatus.COMPLETED
    )

    # Verify S2 Progress
    # S2 has R2 (1.0) and S3 (1.0). Progress = 1.0
    s2_prog = await progress_service.progress_repo.get_section_progress(user.id, s2.id)
    assert s2_prog is not None
    assert s2_prog.progress == 1.0
    assert s2_prog.status == CompletionStatus.COMPLETED

    # Verify S1 Progress
    # S1 has R1 (0.0) and S2 (1.0). Progress = 0.5
    s1_prog = await progress_service.progress_repo.get_section_progress(user.id, s1.id)
    assert s1_prog is not None
    assert s1_prog.progress == 0.5

    # Verify Plan Progress
    sp_prog = await progress_service.progress_repo.get_study_plan_progress(
        user.id, plan.id
    )
    assert sp_prog is not None
    assert sp_prog.progress == 0.5

    # 6. Complete R1 (Top level)
    await progress_service.update_resource_status(
        user.id, plan.id, s1.id, r1.id, CompletionStatus.COMPLETED
    )

    # Verify S1 Progress
    # S1 has R1 (1.0) and S2 (1.0). Progress = 1.0
    s1_prog = await progress_service.progress_repo.get_section_progress(user.id, s1.id)
    assert s1_prog is not None
    assert s1_prog.progress == 1.0
    assert s1_prog.status == CompletionStatus.COMPLETED

    # Verify Plan Progress
    sp_prog = await progress_service.progress_repo.get_study_plan_progress(
        user.id, plan.id
    )
    assert sp_prog is not None
    assert sp_prog.progress == 1.0
    assert sp_prog.status == CompletionStatus.COMPLETED
