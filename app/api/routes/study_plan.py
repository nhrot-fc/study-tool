from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, get_session, get_user_service
from app.domain.schemas.study_plan import (
    StudyPlanCreate,
    StudyPlanRead,
    StudyPlanReadDetail,
)
from app.domain.services.study_plan import StudyPlanService
from app.domain.services.user import UserService
from app.persistence.repository.study_plan import StudyPlanRepository

router = APIRouter()


def get_study_plan_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> StudyPlanService:
    repo = StudyPlanRepository(session)
    return StudyPlanService(repo)


@router.post(
    "/", response_model=StudyPlanReadDetail, status_code=status.HTTP_201_CREATED
)
async def create_study_plan(
    plan_in: StudyPlanCreate,
    current_user: CurrentUser,
    service: Annotated[StudyPlanService, Depends(get_study_plan_service)],
) -> StudyPlanReadDetail:
    if plan_in.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create study plan for another user",
        )

    item = await service.create_study_plan(plan_in)
    return StudyPlanReadDetail.model_validate(item)


@router.get("/", response_model=list[StudyPlanRead])
async def list_study_plans(
    current_user: CurrentUser,
    service: Annotated[StudyPlanService, Depends(get_study_plan_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
) -> list[StudyPlanRead]:
    items, _ = await service.get_user_study_plans(current_user.id, skip, limit)
    return [StudyPlanRead.model_validate(item) for item in items]


@router.get("/{plan_id}", response_model=StudyPlanReadDetail)
async def get_study_plan(
    plan_id: UUID,
    service: Annotated[StudyPlanService, Depends(get_study_plan_service)],
) -> StudyPlanReadDetail:
    plan = await service.get_study_plan_by_id(plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Study plan not found"
        )
    return StudyPlanReadDetail.model_validate(plan)


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
async def list_user_study_plans_by_username(
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
