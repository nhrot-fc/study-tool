from datetime import UTC, datetime, timedelta

from app.core.config import get_settings
from app.core.security import create_access_token, create_refresh_token, verify_password
from app.domain.schemas.token import Token
from app.persistence.model.token import RefreshToken
from app.persistence.model.user import User
from app.persistence.repository.token import RefreshTokenRepository
from app.persistence.repository.user import UserRepository


class AuthService:
    def __init__(
        self,
        user_repository: UserRepository,
        refresh_token_repository: RefreshTokenRepository,
    ):
        self.user_repository = user_repository
        self.refresh_token_repository = refresh_token_repository

    async def authenticate(self, email: str, password: str) -> User | None:
        user = await self.user_repository.get_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    async def create_tokens(self, user: User) -> Token:
        settings = get_settings()

        # Access Token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            subject=user.id, expires_delta=access_token_expires
        )

        # Refresh Token
        refresh_token_str = create_refresh_token()
        refresh_token_expires = datetime.now(UTC) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

        refresh_token = RefreshToken(
            token=refresh_token_str,
            expires_at=refresh_token_expires,
            user_id=user.id,
        )
        await self.refresh_token_repository.create(refresh_token)

        return Token(
            access_token=access_token,
            refresh_token=refresh_token_str,
            token_type="bearer",
        )

    async def refresh_access_token(self, refresh_token_str: str) -> Token | None:
        stored_token = await self.refresh_token_repository.get_by_token(
            refresh_token_str
        )
        if not stored_token:
            return None

        if stored_token.revoked_at:
            await self.refresh_token_repository.revoke_all_for_user(
                stored_token.user_id
            )
            return None

        expires_at = stored_token.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=UTC)

        if expires_at < datetime.now(UTC):
            return None

        stored_token.revoked_at = datetime.now(UTC)
        await self.refresh_token_repository.update(stored_token, stored_token)

        user = await self.user_repository.get_by_id(stored_token.user_id)
        if not user:
            return None

        return await self.create_tokens(user)

    async def logout(self, refresh_token_str: str) -> bool:
        stored_token = await self.refresh_token_repository.get_by_token(
            refresh_token_str
        )
        if stored_token:
            stored_token.revoked_at = datetime.now(UTC)
            await self.refresh_token_repository.update(stored_token, stored_token)
            return True
        return False
