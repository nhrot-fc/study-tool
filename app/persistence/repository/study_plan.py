from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import col

from app.core.config import get_settings
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
            .where(col(StudyPlan.user_id) == user_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(statement)
        items = result.scalars().all()

        count_statement = (
            select(func.count())
            .select_from(StudyPlan)
            .where(col(StudyPlan.user_id) == user_id)
        )
        count_result = await self.session.execute(count_statement)
        total = count_result.scalar_one()

        return list(items), total

    async def get_study_plan_detailed(self, id: UUID) -> StudyPlan | None:
        load_options = [selectinload(StudyPlan.resources)]  # type: ignore
        path = selectinload(StudyPlan.sections)  # type: ignore
        load_options.append(path)

        # Load resources for top-level sections
        load_options.append(path.selectinload(Section.resources))  # type: ignore

        # Recursively load children and their resources
        current_path = path
        for _ in range(get_settings().STUDY_PLAN_MAX_DEPTH):
            current_path = current_path.selectinload(Section.children)  # type: ignore
            load_options.append(current_path)
            load_options.append(current_path.selectinload(Section.resources))  # type: ignore

        statement = (
            select(StudyPlan).where(col(StudyPlan.id) == id).options(*load_options)
        )
        result = await self.session.execute(statement)
        return result.scalars().first()
