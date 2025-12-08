from uuid import UUID

from app.domain.schemas.study_plan import StudyPlanCreate
from app.persistence.model.resource import Resource
from app.persistence.model.section import Section
from app.persistence.model.study_plan import StudyPlan
from app.persistence.repository.study_plan import StudyPlanRepository


class StudyPlanService:
    def __init__(self, study_plan_repository: StudyPlanRepository):
        self.study_plan_repository = study_plan_repository

    async def create_study_plan(
        self, plan_in: StudyPlanCreate, user_id: UUID
    ) -> StudyPlan:
        # Create the main plan
        study_plan = StudyPlan(
            title=plan_in.title,
            description=plan_in.description,
            user_id=user_id,
        )

        # Create resources for the plan
        for res_in in plan_in.resources:
            resource = Resource(
                title=res_in.title,
                url=res_in.url,
                type=res_in.type,
                description=res_in.description,
                duration_seconds=res_in.duration_seconds,
            )
            study_plan.resources.append(resource)

        # Create sections (and their resources/children)
        # Note: This is a simplified recursive creation.
        # For very deep structures, consider an iterative approach or separate method.
        for sec_in in plan_in.sections:
            section = Section(
                title=sec_in.title,
                description=sec_in.description,
                order=sec_in.order,
                notes=sec_in.notes,
            )

            # Section resources
            for res_in in sec_in.resources:
                resource = Resource(
                    title=res_in.title,
                    url=res_in.url,
                    type=res_in.type,
                    description=res_in.description,
                    duration_seconds=res_in.duration_seconds,
                )
                section.resources.append(resource)

            # Section children
            for child_in in sec_in.children:
                child_section = Section(
                    title=child_in.title,
                    description=child_in.description,
                    order=child_in.order,
                    notes=child_in.notes,
                )
                # Child resources
                for res_in in child_in.resources:
                    resource = Resource(
                        title=res_in.title,
                        url=res_in.url,
                        type=res_in.type,
                        description=res_in.description,
                        duration_seconds=res_in.duration_seconds,
                    )
                    child_section.resources.append(resource)

                section.children.append(child_section)

            study_plan.sections.append(section)

        created_plan = await self.study_plan_repository.create(study_plan)
        item = await self.study_plan_repository.get_with_details(created_plan.id)
        if item is None:
            raise Exception("Failed to retrieve created study plan")
        return item

    async def get_user_study_plans(
        self, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[StudyPlan], int]:
        return await self.study_plan_repository.get_by_user(user_id, skip, limit)

    async def get_study_plan_by_id(self, id: UUID, user_id: UUID) -> StudyPlan | None:
        plan = await self.study_plan_repository.get_with_details(id)
        if plan and plan.user_id == user_id:
            return plan
        return None
