from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import (
    CurrentUser,
    CurrentUserOptional,
    get_gemini_service,
    get_progress_service,
    get_study_plan_service,
    get_user_service,
)
from app.domain.schemas.progress import StudyPlanProgressRead
from app.domain.schemas.study_plan import (
    StudyPlanCreate,
    StudyPlanGenerateRequest,
    StudyPlanProposal,
    StudyPlanRead,
    StudyPlanReadDetail,
    StudyPlanReadDetailWithProgress,
    StudyPlanUpdate,
)
from app.domain.services.gemini import GeminiService
from app.domain.services.progress import ProgressService
from app.domain.services.study_plan import StudyPlanService
from app.domain.services.user import UserService

router = APIRouter()


@router.post(
    "/", response_model=StudyPlanReadDetail, status_code=status.HTTP_201_CREATED
)
async def create_study_plan(
    plan_in: StudyPlanCreate,
    current_user: CurrentUser,
    service: Annotated[StudyPlanService, Depends(get_study_plan_service)],
) -> StudyPlanReadDetail:
    # Check that the user_id matches the current user
    if plan_in.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create study plan for another user",
        )

    try:
        item = await service.create_study_plan(plan_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from None
    return StudyPlanReadDetail.model_validate(item)


@router.post("/generate", response_model=StudyPlanProposal)
async def generate_study_plan(
    request: StudyPlanGenerateRequest,
    gemini_service: Annotated[GeminiService, Depends(get_gemini_service)],
    current_user: CurrentUser,
) -> StudyPlanProposal:
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authentication required to generate study plans",
        ) from None

    proposal = gemini_service.generate_study_plan_proposal(
        message=request.message,
        topic=request.topic,
        existing_proposal=request.proposal,
    )

    if not proposal:
        raise HTTPException(status_code=500, detail="Failed to generate study plan")

    return proposal


@router.get("/{plan_id}", response_model=StudyPlanReadDetailWithProgress)
async def get_study_plan(
    plan_id: UUID,
    service: Annotated[StudyPlanService, Depends(get_study_plan_service)],
    progress_service: Annotated[ProgressService, Depends(get_progress_service)],
    current_user: CurrentUserOptional,
) -> StudyPlanReadDetailWithProgress:
    plan = await service.get_study_plan_detailed(plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Study plan not found"
        )

    progress = None
    if current_user:
        progress = await progress_service.initialize_study_plan_progress(
            current_user.id, plan_id
        )
        progress = StudyPlanProgressRead.model_validate(progress)

    detail = StudyPlanReadDetail.model_validate(plan)
    return StudyPlanReadDetailWithProgress(**detail.model_dump(), progress=progress)


@router.put("/{plan_id}", response_model=StudyPlanReadDetail)
async def update_study_plan(
    plan_id: UUID,
    plan_in: StudyPlanUpdate,
    current_user: CurrentUser,
    service: Annotated[StudyPlanService, Depends(get_study_plan_service)],
    progress_service: Annotated[ProgressService, Depends(get_progress_service)],
) -> StudyPlanReadDetail:
    plan = await service.get_study_plan_detailed(plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Study plan not found"
        )
    if plan.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update study plan for another user",
        )

    updated_plan = await service.update_study_plan(plan_id, plan_in, progress_service)
    return StudyPlanReadDetail.model_validate(updated_plan)


@router.post(
    "/{plan_id}/fork",
    response_model=StudyPlanReadDetail,
    status_code=status.HTTP_201_CREATED,
)
async def fork_study_plan(
    plan_id: UUID,
    current_user: CurrentUser,
    service: Annotated[StudyPlanService, Depends(get_study_plan_service)],
) -> StudyPlanReadDetail:
    item = await service.fork_study_plan(plan_id, current_user.id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Study plan not found"
        )
    return StudyPlanReadDetail.model_validate(item)


@router.get("/user/{user_id}", response_model=list[StudyPlanRead])
async def list_user_study_plans(
    user_id: UUID,
    service: Annotated[StudyPlanService, Depends(get_study_plan_service)],
    user_service: Annotated[UserService, Depends(get_user_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
) -> list[StudyPlanRead]:
    user = await user_service.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    items, _ = await service.get_user_study_plans(user.id, skip, limit)
    return [StudyPlanRead.model_validate(item) for item in items]
