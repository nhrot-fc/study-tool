from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.persistence.model.section import Section
from app.persistence.model.study_plan import StudyPlan
from app.persistence.repository.base import BaseRepository


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
        statement = (
            select(StudyPlan)
            .where(StudyPlan.id == id)  # type: ignore
            .options(
                selectinload(StudyPlan.resources),  # type: ignore
                selectinload(StudyPlan.sections).selectinload(Section.resources),  # type: ignore
                selectinload(StudyPlan.sections)  # type: ignore
                .selectinload(Section.children)  # type: ignore
                .selectinload(Section.resources),  # type: ignore
            )
        )
        result = await self.session.execute(statement)
        return result.scalars().first()
