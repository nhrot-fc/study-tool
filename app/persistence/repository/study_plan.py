from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.persistence.model.section import Section
from app.persistence.model.study_plan import StudyPlan
from app.persistence.repository.base import BaseRepository

STUDY_PLAN_MAX_DEPTH = 5


class StudyPlanRepository(BaseRepository[StudyPlan]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, StudyPlan)

    async def get_by_user(
        self, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[StudyPlan], int]:
        statement = (
            select(StudyPlan)
            .where(StudyPlan.user_id == user_id)  # type: ignore
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(statement)
        items = result.scalars().all()

        count_statement = (
            select(func.count())
            .select_from(StudyPlan)
            .where(StudyPlan.user_id == user_id)  # type: ignore
        )
        count_result = await self.session.execute(count_statement)
        total = count_result.scalar_one()

        return list(items), total

    async def get_with_details(self, id: UUID) -> StudyPlan | None:
        load_options = [selectinload(StudyPlan.resources)]  # type: ignore
        path = selectinload(StudyPlan.sections)  # type: ignore
        load_options.append(path.selectinload(Section.resources))  # type: ignore

        for _ in range(STUDY_PLAN_MAX_DEPTH):
            path = path.selectinload(Section.children)  # type: ignore
            load_options.append(path.selectinload(Section.resources))  # type: ignore

        statement = (
            select(StudyPlan)
            .where(StudyPlan.id == id)  # type: ignore
            .options(*load_options)
        )
        result = await self.session.execute(statement)
        return result.scalars().first()
