from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.dependencies import CurrentUser, get_auth_service, get_user_service
from app.domain.schemas.auth import LoginRequest, RegisterRequest
from app.domain.schemas.token import Token
from app.domain.schemas.user import UserCreate, UserRead
from app.domain.services.auth import AuthService
from app.domain.services.user import UserService

router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: RegisterRequest,
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> UserRead:
    user = await user_service.create_user(
        UserCreate(
            username=user_in.username, email=user_in.email, password=user_in.password
        )
    )
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
    elif not user.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
    return await service.create_tokens(user)


@router.post("/access-token", response_model=Token)
async def login_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests.
    Uses username field as email.
    """
    user = await service.authenticate(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    elif not user.active:
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


@router.post("/unregister")
async def unregister(
    current_user: CurrentUser,
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> dict[str, str]:
    await user_service.delete_user(current_user.id)
    return {"message": "User account deleted successfully"}
