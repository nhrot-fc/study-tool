from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.dependencies import CurrentUser, get_progress_service
from app.domain.enums import CompletionStatus
from app.domain.schemas.progress import ResourceProgressRead
from app.domain.services.progress import ProgressService

router = APIRouter()


class StatusUpdate(BaseModel):
    status: CompletionStatus


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
