from uuid import UUID

from app.core.config import get_settings
from app.domain.schemas.resource import ResourceCreate, ResourceUpsert
from app.domain.schemas.section import SectionCreate, SectionUpsert
from app.domain.schemas.study_plan import StudyPlanCreate, StudyPlanUpdate
from app.domain.services.progress import ProgressService
from app.persistence.model.resource import Resource
from app.persistence.model.section import Section
from app.persistence.model.study_plan import StudyPlan
from app.persistence.repository.study_plan import (
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
            duration_minutes=resource_in.duration_minutes,
        )

    def _create_section_entity(
        self, section_in: SectionCreate | SectionUpsert
    ) -> Section:
        section = Section(
            title=section_in.title,
            description=section_in.description,
            order=section_in.order,
        )

        for res_in in section_in.resources:
            section.resources.append(self._create_resource_entity(res_in))

        for child_in in section_in.children:
            section.children.append(self._create_section_entity(child_in))

        return section

    def _validate_depth(self, section: SectionCreate, current_depth: int = 1) -> None:
        max_depth = get_settings().STUDY_PLAN_MAX_DEPTH
        if current_depth > max_depth:
            raise ValueError(f"Maximum section nesting depth of {max_depth} exceeded")

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
        item = await self.study_plan_repository.get_study_plan_detailed(created_plan.id)
        if item is None:
            raise Exception("Failed to retrieve created study plan")
        return item

    async def get_by_id(self, id: UUID) -> StudyPlan | None:
        return await self.study_plan_repository.get_by_id(id)

    async def get_user_study_plans(
        self, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[StudyPlan], int]:
        return await self.study_plan_repository.get_by_user(user_id, skip, limit)

    async def get_study_plan_detailed(self, id: UUID) -> StudyPlan | None:
        plan = await self.study_plan_repository.get_study_plan_detailed(id)
        return plan

    def _copy_resource(self, resource: Resource) -> Resource:
        return Resource(
            title=resource.title,
            url=resource.url,
            type=resource.type,
            description=resource.description,
            duration_minutes=resource.duration_minutes,
        )

    def _copy_section(self, section: Section) -> Section:
        new_section = Section(
            title=section.title,
            description=section.description,
            order=section.order,
        )
        for res in section.resources:
            new_section.resources.append(self._copy_resource(res))

        for child in section.children:
            new_section.children.append(self._copy_section(child))

        return new_section

    async def fork_study_plan(
        self, original_plan_id: UUID, user_id: UUID
    ) -> StudyPlan | None:
        original_plan = await self.study_plan_repository.get_study_plan_detailed(
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
        item = await self.study_plan_repository.get_study_plan_detailed(created_plan.id)
        if item is None:
            raise Exception("Failed to retrieve created study plan")
        return item

    async def update_study_plan(
        self,
        plan_id: UUID,
        update_in: StudyPlanUpdate,
        progress_service: ProgressService,
    ) -> StudyPlan:
        plan = await self.study_plan_repository.get_study_plan_detailed(plan_id)
        if not plan:
            raise ValueError("Study plan not found")

        if update_in.title is not None:
            plan.title = update_in.title
        if update_in.description is not None:
            plan.description = update_in.description

        if update_in.sections is not None:
            await self._sync_sections(
                plan, update_in.sections, progress_service, plan.user_id
            )

        await self.study_plan_repository.session.commit()
        await self.study_plan_repository.session.refresh(plan)

        await progress_service.sync_study_plan_progress(plan.user_id, plan.id)

        return plan

    async def _sync_sections(
        self,
        plan: StudyPlan,
        sections_in: list[SectionUpsert],
        progress_service: ProgressService,
        user_id: UUID,
    ) -> None:
        existing_sections_map = {s.id: s for s in plan.sections}
        new_sections_list = []

        for i, sec_in in enumerate(sections_in):
            if sec_in.id and sec_in.id in existing_sections_map:
                existing_sec = existing_sections_map[sec_in.id]

                affected = False
                if (
                    existing_sec.title != sec_in.title
                    or existing_sec.description != sec_in.description
                ):
                    existing_sec.title = sec_in.title
                    existing_sec.description = sec_in.description
                    affected = True

                existing_sec.order = i

                res_affected = await self._sync_resources(
                    existing_sec, sec_in.resources, progress_service, user_id
                )
                child_affected = await self._sync_children(
                    existing_sec, sec_in.children, progress_service, user_id
                )

                if affected or res_affected or child_affected:
                    await progress_service.reset_section_progress(
                        user_id, existing_sec.id
                    )

                new_sections_list.append(existing_sec)
                del existing_sections_map[sec_in.id]
            else:
                new_sec = self._create_section_entity(sec_in)
                new_sec.order = i
                new_sections_list.append(new_sec)

        for sec_to_delete in existing_sections_map.values():
            await self.study_plan_repository.session.delete(sec_to_delete)

        plan.sections = new_sections_list

    async def _sync_children(
        self,
        parent: Section,
        children_in: list[SectionUpsert],
        progress_service: ProgressService,
        user_id: UUID,
    ) -> bool:
        existing_children_map = {s.id: s for s in parent.children}
        new_children_list = []
        any_affected = False

        for i, child_in in enumerate(children_in):
            if child_in.id and child_in.id in existing_children_map:
                existing_child = existing_children_map[child_in.id]

                affected = False
                if (
                    existing_child.title != child_in.title
                    or existing_child.description != child_in.description
                ):
                    existing_child.title = child_in.title
                    existing_child.description = child_in.description
                    affected = True

                existing_child.order = i

                res_affected = await self._sync_resources(
                    existing_child, child_in.resources, progress_service, user_id
                )
                grandchild_affected = await self._sync_children(
                    existing_child, child_in.children, progress_service, user_id
                )

                if affected or res_affected or grandchild_affected:
                    await progress_service.reset_section_progress(
                        user_id, existing_child.id
                    )
                    any_affected = True

                new_children_list.append(existing_child)
                del existing_children_map[child_in.id]
            else:
                new_child = self._create_section_entity(child_in)
                new_child.order = i
                new_children_list.append(new_child)
                any_affected = True

        for child_to_delete in existing_children_map.values():
            await self.study_plan_repository.session.delete(child_to_delete)
            any_affected = True

        parent.children = new_children_list
        return any_affected

    async def _sync_resources(
        self,
        section: Section,
        resources_in: list[ResourceUpsert],
        progress_service: ProgressService,
        user_id: UUID,
    ) -> bool:
        existing_res_map = {r.id: r for r in section.resources}
        new_res_list = []
        any_affected = False

        for res_in in resources_in:
            if res_in.id and res_in.id in existing_res_map:
                existing_res = existing_res_map[res_in.id]

                affected = False
                if (
                    existing_res.title != res_in.title
                    or existing_res.url != res_in.url
                    or existing_res.type != res_in.type
                    or existing_res.description != res_in.description
                    or existing_res.duration_minutes != res_in.duration_minutes
                ):
                    existing_res.title = res_in.title
                    existing_res.url = res_in.url
                    existing_res.type = res_in.type
                    existing_res.description = res_in.description
                    existing_res.duration_minutes = res_in.duration_minutes
                    affected = True

                if affected:
                    await progress_service.reset_resource_progress(
                        user_id, existing_res.id
                    )
                    any_affected = True

                new_res_list.append(existing_res)
                del existing_res_map[res_in.id]
            else:
                new_res = self._create_resource_entity(res_in)
                new_res_list.append(new_res)
                any_affected = True

        if existing_res_map:
            any_affected = True

        section.resources = new_res_list
        return any_affected

    async def delete_study_plan(self, plan_id: UUID) -> None:
        plan = await self.study_plan_repository.get_by_id(plan_id)
        if not plan:
            raise ValueError("Study plan not found")

        await self.study_plan_repository.soft_delete(plan)
