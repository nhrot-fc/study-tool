from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_session
from app.domain.schemas.token import TokenPayload
from app.domain.services.auth import AuthService
from app.domain.services.gemini import GeminiService
from app.domain.services.progress import ProgressService
from app.domain.services.user import UserService
from app.persistence.model.user import User
from app.persistence.repository.progress import ProgressRepository
from app.persistence.repository.section import SectionRepository
from app.persistence.repository.study_plan import StudyPlanRepository
from app.persistence.repository.token import RefreshTokenRepository
from app.persistence.repository.user import UserRepository

SessionDep = Annotated[AsyncSession, Depends(get_session)]
settings = get_settings()
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{get_settings().API_V1_STR}/auth/access-token",
    refreshUrl=f"{get_settings().API_V1_STR}/auth/refresh",
)
reusable_oauth2_optional = OAuth2PasswordBearer(
    tokenUrl=f"{get_settings().API_V1_STR}/auth/access-token",
    refreshUrl=f"{get_settings().API_V1_STR}/auth/refresh",
    auto_error=False,
)


def get_user_repository(session: SessionDep) -> UserRepository:
    return UserRepository(session)


def get_refresh_token_repository(session: SessionDep) -> RefreshTokenRepository:
    return RefreshTokenRepository(session)


def get_user_service(
    repo: Annotated[UserRepository, Depends(get_user_repository)],
) -> UserService:
    return UserService(repo)


def get_auth_service(
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
    token_repo: Annotated[
        RefreshTokenRepository, Depends(get_refresh_token_repository)
    ],
) -> AuthService:
    return AuthService(user_repo, token_repo)


def get_progress_service(
    session: SessionDep,
) -> ProgressService:
    progress_repo = ProgressRepository(session)
    study_plan_repo = StudyPlanRepository(session)
    section_repo = SectionRepository(session)
    return ProgressService(progress_repo, study_plan_repo, section_repo)


async def get_current_user(
    token: Annotated[str, Depends(reusable_oauth2)],
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> User:
    try:
        payload = jwt.decode(
            token, get_settings().SECRET_KEY, algorithms=[get_settings().ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (jwt.InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        ) from None

    if token_data.sub is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = await user_service.user_repository.get_by_id(UUID(token_data.sub))

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


async def get_current_user_optional(
    token: Annotated[str | None, Depends(reusable_oauth2_optional)],
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> User | None:
    if not token:
        return None
    try:
        payload = jwt.decode(
            token, get_settings().SECRET_KEY, algorithms=[get_settings().ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (jwt.InvalidTokenError, ValidationError):
        return None

    if token_data.sub is None:
        return None

    user = await user_service.user_repository.get_by_id(UUID(token_data.sub))

    if not user or not user.is_active:
        return None
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentUserOptional = Annotated[User | None, Depends(get_current_user_optional)]


def get_gemini_service() -> GeminiService:
    return GeminiService()
