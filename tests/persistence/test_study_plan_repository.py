import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.enums import ResourceType
from app.persistence.model.resource import Resource
from app.persistence.model.section import Section
from app.persistence.model.study_plan import StudyPlan
from app.persistence.model.user import User
from app.persistence.repository.study_plan import StudyPlanRepository


@pytest.mark.asyncio
async def test_get_with_details(
    session: AsyncSession, study_plan_repository: StudyPlanRepository
):
    # 1. Create User
    user = User(
        email="repo_test@example.com", username="repotest", hashed_password="hash"
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    # 2. Create Study Plan with nested structure
    plan = StudyPlan(
        title="Complex Plan", description="Testing repository", user_id=user.id
    )

    # Section 1
    s1 = Section(title="S1", order=0)
    r1 = Resource(title="R1", url="http://r1", type=ResourceType.ARTICLE)
    s1.resources.append(r1)

    # Section 1.1 (Child)
    s1_1 = Section(title="S1.1", order=0)
    r1_1 = Resource(title="R1.1", url="http://r1.1", type=ResourceType.VIDEO)
    s1_1.resources.append(r1_1)

    s1.children.append(s1_1)
    plan.sections.append(s1)

    session.add(plan)
    await session.commit()
    await session.refresh(plan)

    # 3. Fetch with details
    fetched_plan = await study_plan_repository.get_study_plan_detailed(plan.id)

    assert fetched_plan is not None
    assert fetched_plan.id == plan.id
    assert len(fetched_plan.sections) == 1

    fetched_s1 = fetched_plan.sections[0]
    assert fetched_s1.title == "S1"
    assert len(fetched_s1.resources) == 1
    assert fetched_s1.resources[0].title == "R1"

    assert len(fetched_s1.children) == 1
    fetched_s1_1 = fetched_s1.children[0]
    assert fetched_s1_1.title == "S1.1"
    assert len(fetched_s1_1.resources) == 1
    assert fetched_s1_1.resources[0].title == "R1.1"
