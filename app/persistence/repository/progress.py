from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import col

from app.persistence.model.progress import (
    ResourceProgress,
    SectionProgress,
    StudyPlanProgress,
)
from app.persistence.repository.base import BaseRepository


class ProgressRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.study_plan = BaseRepository(session, StudyPlanProgress)
        self.section = BaseRepository(session, SectionProgress)
        self.resource = BaseRepository(session, ResourceProgress)

    async def get_study_plan_progress(
        self, user_id: UUID, study_plan_id: UUID
    ) -> StudyPlanProgress | None:
        statement = (
            select(StudyPlanProgress)
            .where(
                col(StudyPlanProgress.user_id) == user_id,
                col(StudyPlanProgress.study_plan_id) == study_plan_id,
            )
            .options(
                selectinload(StudyPlanProgress.section_progresses).selectinload(  # type: ignore
                    SectionProgress.resource_progresses  # type: ignore
                )
            )
        )
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def get_section_progress(
        self, user_id: UUID, section_id: UUID
    ) -> SectionProgress | None:
        statement = (
            select(SectionProgress)
            .where(
                col(SectionProgress.user_id) == user_id,
                col(SectionProgress.section_id) == section_id,
            )
            .options(selectinload(SectionProgress.resource_progresses))  # type: ignore
        )
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def get_resource_progress(
        self, user_id: UUID, resource_id: UUID
    ) -> ResourceProgress | None:
        statement = select(ResourceProgress).where(
            col(ResourceProgress.user_id) == user_id,
            col(ResourceProgress.resource_id) == resource_id,
        )
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def get_or_create_study_plan_progress(
        self, user_id: UUID, study_plan_id: UUID
    ) -> StudyPlanProgress:
        progress = await self.get_study_plan_progress(user_id, study_plan_id)
        if not progress:
            progress = StudyPlanProgress(user_id=user_id, study_plan_id=study_plan_id)
            progress = await self.study_plan.create(progress)
        return progress
