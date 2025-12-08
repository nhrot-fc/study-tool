from uuid import UUID

from app.domain.schemas.resource import ResourceCreate
from app.domain.schemas.section import SectionCreate
from app.domain.schemas.study_plan import StudyPlanCreate
from app.persistence.model.resource import Resource
from app.persistence.model.section import Section
from app.persistence.model.study_plan import StudyPlan
from app.persistence.repository.study_plan import (
    STUDY_PLAN_MAX_DEPTH,
    StudyPlanRepository,
)


class StudyPlanService:
    def __init__(self, study_plan_repository: StudyPlanRepository):
        self.study_plan_repository = study_plan_repository

    def _create_resource_entity(self, resource_in: ResourceCreate) -> Resource:
        return Resource(
            title=resource_in.title,
            url=resource_in.url,
            type=resource_in.type,
            description=resource_in.description,
            duration_seconds=resource_in.duration_seconds,
        )

    def _create_section_entity(self, section_in: SectionCreate) -> Section:
        section = Section(
            title=section_in.title,
            description=section_in.description,
            order=section_in.order,
            notes=section_in.notes,
        )

        for res_in in section_in.resources:
            section.resources.append(self._create_resource_entity(res_in))

        for child_in in section_in.children:
            section.children.append(self._create_section_entity(child_in))

        return section

    def _validate_depth(self, section: SectionCreate, current_depth: int = 1) -> None:
        if current_depth > STUDY_PLAN_MAX_DEPTH:
            raise ValueError(
                f"Maximum section nesting depth of {STUDY_PLAN_MAX_DEPTH} exceeded"
            )

        for child in section.children:
            self._validate_depth(child, current_depth + 1)

    async def create_study_plan(self, plan_in: StudyPlanCreate) -> StudyPlan:
        # Validate depth
        for sec_in in plan_in.sections:
            self._validate_depth(sec_in)

        # Create the main plan
        study_plan = StudyPlan(
            title=plan_in.title,
            description=plan_in.description,
            user_id=plan_in.user_id,
        )

        # Create resources for the plan
        for res_in in plan_in.resources:
            study_plan.resources.append(self._create_resource_entity(res_in))

        # Create sections (and their resources/children)
        for sec_in in plan_in.sections:
            study_plan.sections.append(self._create_section_entity(sec_in))

        created_plan = await self.study_plan_repository.create(study_plan)
        item = await self.study_plan_repository.get_with_details(created_plan.id)
        if item is None:
            raise Exception("Failed to retrieve created study plan")
        return item

    async def get_user_study_plans(
        self, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[StudyPlan], int]:
        return await self.study_plan_repository.get_by_user(user_id, skip, limit)

    async def get_study_plan_by_id(self, id: UUID) -> StudyPlan | None:
        plan = await self.study_plan_repository.get_with_details(id)
        return plan

    def _copy_resource(self, resource: Resource) -> Resource:
        return Resource(
            title=resource.title,
            url=resource.url,
            type=resource.type,
            description=resource.description,
            duration_seconds=resource.duration_seconds,
        )

    def _copy_section(self, section: Section) -> Section:
        new_section = Section(
            title=section.title,
            description=section.description,
            order=section.order,
            notes=section.notes,
        )
        for res in section.resources:
            new_section.resources.append(self._copy_resource(res))

        for child in section.children:
            new_section.children.append(self._copy_section(child))

        return new_section

    async def fork_study_plan(
        self, original_plan_id: UUID, user_id: UUID
    ) -> StudyPlan | None:
        original_plan = await self.study_plan_repository.get_with_details(
            original_plan_id
        )
        if not original_plan:
            return None

        new_plan = StudyPlan(
            title=f"Copy of {original_plan.title}",
            description=original_plan.description,
            user_id=user_id,
            forked_from_id=original_plan.id,
        )

        for res in original_plan.resources:
            new_plan.resources.append(self._copy_resource(res))

        for sec in original_plan.sections:
            new_plan.sections.append(self._copy_section(sec))

        created_plan = await self.study_plan_repository.create(new_plan)
        item = await self.study_plan_repository.get_with_details(created_plan.id)
        if item is None:
            raise Exception("Failed to retrieve created study plan")
        return item
