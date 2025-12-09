from datetime import UTC, datetime
from uuid import UUID

from app.domain.enums import CompletionStatus
from app.persistence.model.progress import (
    ResourceProgress,
    SectionProgress,
    StudyPlanProgress,
)
from app.persistence.model.section import Section
from app.persistence.repository.progress import ProgressRepository
from app.persistence.repository.section import SectionRepository
from app.persistence.repository.study_plan import StudyPlanRepository


class ProgressService:
    def __init__(
        self,
        progress_repo: ProgressRepository,
        study_plan_repo: StudyPlanRepository,
        section_repo: SectionRepository,
    ):
        self.progress_repo = progress_repo
        self.study_plan_repo = study_plan_repo
        self.section_repo = section_repo

    async def initialize_study_plan_progress(
        self, user_id: UUID, study_plan_id: UUID
    ) -> StudyPlanProgress:
        existing = await self.progress_repo.get_study_plan_progress(
            user_id, study_plan_id
        )
        if existing:
            return existing

        plan = await self.study_plan_repo.get_with_details(study_plan_id)
        if not plan:
            raise ValueError("Study plan not found")

        sp_progress = await self.progress_repo.study_plan.create(
            StudyPlanProgress(user_id=user_id, study_plan_id=study_plan_id)
        )

        await self._create_section_progress_tree(user_id, sp_progress.id, plan.sections)

        return sp_progress

    async def _create_section_progress_tree(
        self, user_id: UUID, sp_progress_id: UUID, sections: list[Section]
    ) -> None:
        for section in sections:
            sec_progress = await self.progress_repo.section.create(
                SectionProgress(
                    user_id=user_id,
                    section_id=section.id,
                    study_plan_progress_id=sp_progress_id,
                )
            )

            for resource in section.resources:
                await self.progress_repo.resource.create(
                    ResourceProgress(
                        user_id=user_id,
                        resource_id=resource.id,
                        section_progress_id=sec_progress.id,
                    )
                )

            if section.children:
                await self._create_section_progress_tree(
                    user_id, sp_progress_id, section.children
                )

    async def update_resource_status(
        self,
        user_id: UUID,
        study_plan_id: UUID,
        section_id: UUID,
        resource_id: UUID,
        status: CompletionStatus,
    ) -> ResourceProgress:
        sp_progress = await self.initialize_study_plan_progress(user_id, study_plan_id)

        sec_progress = await self.progress_repo.get_section_progress(
            user_id, section_id
        )
        if not sec_progress:
            raise ValueError("Section progress not found")

        res_progress = await self.progress_repo.get_resource_progress(
            user_id, resource_id
        )
        if not res_progress:
            raise ValueError("Resource progress not found")

        if res_progress.section_progress_id != sec_progress.id:
            raise ValueError("Resource does not belong to this section")

        res_progress.status = status
        res_progress.completed_at = (
            datetime.now(UTC) if status == CompletionStatus.COMPLETED else None
        )

        await self.progress_repo.resource.update(res_progress, res_progress)

        await self._recalculate_section_progress(sec_progress)
        await self._recalculate_study_plan_progress(sp_progress)

        await self.progress_repo.session.refresh(res_progress)
        return res_progress

    async def _recalculate_section_progress(
        self, section_progress: SectionProgress
    ) -> None:
        section = await self.section_repo.get_with_details(section_progress.section_id)
        if not section:
            return

        resource_score = await self._calculate_resource_score(section_progress)
        children_score = await self._calculate_children_score(
            section, section_progress.user_id
        )

        total_items = len(section.resources) + len(section.children)
        new_progress = (
            (resource_score + children_score) / total_items if total_items > 0 else 0.0
        )

        self._update_progress_status(section_progress, new_progress)
        await self.progress_repo.section.update(section_progress, section_progress)

        if section.parent_id:
            parent_progress = await self.progress_repo.get_section_progress(
                section_progress.user_id, section.parent_id
            )
            if parent_progress:
                await self._recalculate_section_progress(parent_progress)

    async def _calculate_resource_score(
        self, section_progress: SectionProgress
    ) -> float:
        # Reload to get latest resource statuses
        sp_fresh = await self.progress_repo.get_section_progress(
            section_progress.user_id, section_progress.section_id
        )
        if not sp_fresh:
            return 0.0

        completed = sum(
            1
            for rp in sp_fresh.resource_progresses
            if rp.status == CompletionStatus.COMPLETED
        )
        return float(completed)

    async def _calculate_children_score(self, section: Section, user_id: UUID) -> float:
        score = 0.0
        for child in section.children:
            child_progress = await self.progress_repo.get_section_progress(
                user_id, child.id
            )
            if child_progress:
                score += child_progress.progress
        return score

    async def _recalculate_study_plan_progress(
        self, sp_progress: StudyPlanProgress
    ) -> None:
        plan_details = await self.study_plan_repo.get_with_details(
            sp_progress.study_plan_id
        )
        if not plan_details:
            return

        top_level_sections = [s for s in plan_details.sections if s.parent_id is None]
        total_sections = len(top_level_sections)

        progress_sum = 0.0
        for section in top_level_sections:
            sec_progress = await self.progress_repo.get_section_progress(
                sp_progress.user_id, section.id
            )
            if sec_progress:
                progress_sum += sec_progress.progress

        new_progress = progress_sum / total_sections if total_sections > 0 else 0.0

        self._update_progress_status(sp_progress, new_progress)
        await self.progress_repo.study_plan.update(sp_progress, sp_progress)

    def _update_progress_status(
        self, entity: SectionProgress | StudyPlanProgress, progress: float
    ) -> None:
        entity.progress = progress
        if progress == 1.0:
            entity.status = CompletionStatus.COMPLETED
            entity.completed_at = datetime.now(UTC)
        elif progress > 0:
            entity.status = CompletionStatus.IN_PROGRESS
            entity.completed_at = None
        else:
            entity.status = CompletionStatus.NOT_STARTED
            entity.completed_at = None
