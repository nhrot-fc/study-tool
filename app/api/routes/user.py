from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_user_service
from app.domain.schemas.user import UserRead
from app.domain.services.user import UserService

router = APIRouter()


@router.get("/", response_model=list[UserRead])
async def search_users(
    service: Annotated[UserService, Depends(get_user_service)],
    username: str = Query(..., min_length=3),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
) -> list[UserRead]:
    users, _ = await service.fetch(username, skip, limit)
    return [UserRead.model_validate(user) for user in users]
