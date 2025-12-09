from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, get_session
from app.domain.enums import CompletionStatus
from app.domain.schemas.progress import ResourceProgressRead, StudyPlanProgressRead
from app.domain.services.progress import ProgressService
from app.persistence.repository.progress import ProgressRepository
from app.persistence.repository.section import SectionRepository
from app.persistence.repository.study_plan import StudyPlanRepository

router = APIRouter()


class StatusUpdate(BaseModel):
    status: CompletionStatus


def get_progress_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ProgressService:
    progress_repo = ProgressRepository(session)
    study_plan_repo = StudyPlanRepository(session)
    section_repo = SectionRepository(session)
    return ProgressService(progress_repo, study_plan_repo, section_repo)


@router.post(
    "/study-plans/{study_plan_id}/sections/{section_id}/resources/{resource_id}/status",
    response_model=ResourceProgressRead,
)
async def update_resource_status(
    study_plan_id: UUID,
    section_id: UUID,
    resource_id: UUID,
    status_update: StatusUpdate,
    current_user: CurrentUser,
    service: Annotated[ProgressService, Depends(get_progress_service)],
) -> ResourceProgressRead:
    try:
        resource_upd = await service.update_resource_status(
            user_id=current_user.id,
            study_plan_id=study_plan_id,
            section_id=section_id,
            resource_id=resource_id,
            status=status_update.status,
        )
        return ResourceProgressRead.model_validate(resource_upd)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.get(
    "/study-plans/{study_plan_id}/progress",
    response_model=StudyPlanProgressRead,
)
async def get_study_plan_progress(
    study_plan_id: UUID,
    current_user: CurrentUser,
    service: Annotated[ProgressService, Depends(get_progress_service)],
) -> StudyPlanProgressRead:
    progress = await service.initialize_study_plan_progress(
        current_user.id, study_plan_id
    )
    return StudyPlanProgressRead.model_validate(progress)
