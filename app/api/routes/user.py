from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import get_user_service
from app.domain.schemas.user import UserRead
from app.domain.services.user import UserService

router = APIRouter()


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: UUID,
    service: Annotated[UserService, Depends(get_user_service)],
) -> UserRead:
    user = await service.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return UserRead.model_validate(user)


@router.get("/", response_model=list[UserRead])
async def search_users(
    service: Annotated[UserService, Depends(get_user_service)],
    username: str | None = Query(None, min_length=3),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
) -> list[UserRead]:
    users, _ = await service.fetch(username, skip, limit)
    return [UserRead.model_validate(user) for user in users]
