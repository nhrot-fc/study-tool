from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException, status

from app.core.dependencies import CurrentUser, get_auth_service, get_user_service
from app.domain.schemas.auth import LoginRequest
from app.domain.schemas.token import Token
from app.domain.schemas.user import UserCreate, UserRead
from app.domain.services.auth import AuthService
from app.domain.services.user import UserService

router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserCreate,
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> UserRead:
    user = await user_service.get_user_by_email(user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
    user = await user_service.create_user(user_in)
    return UserRead.model_validate(user)


@router.post("/login", response_model=Token)
async def login(
    form_data: Annotated[LoginRequest, Body()],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> Token:
    user = await service.authenticate(form_data.email, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
    return await service.create_tokens(user)


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: Annotated[str, Body(embed=True)],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> Token:
    token = await service.refresh_access_token(refresh_token)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    return token


@router.post("/logout")
async def logout(
    refresh_token: Annotated[str, Body(embed=True)],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict[str, str]:
    success = await service.logout(refresh_token)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid refresh token",
        )
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserRead)
async def read_users_me(current_user: CurrentUser) -> UserRead:
    return UserRead.model_validate(current_user)
