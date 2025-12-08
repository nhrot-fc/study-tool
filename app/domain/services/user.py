from uuid import UUID

from sqlmodel import col

from app.core.security import hash_password
from app.domain.schemas.user import UserCreate
from app.persistence.model.user import User
from app.persistence.repository.user import UserRepository


class UserService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    async def create_user(self, user_in: UserCreate) -> User:
        hashed_password = hash_password(user_in.password)
        user = User(
            email=user_in.email,
            username=user_in.username,
            hashed_password=hashed_password,
            is_active=user_in.is_active,
        )
        return await self.user_repository.create(user)

    async def get_user_by_email(self, email: str) -> User | None:
        return await self.user_repository.get_by_email(email)

    async def get_by_id(self, user_id: UUID) -> User | None:
        return await self.user_repository.get_by_id(user_id)

    async def fetch(
        self, search_username: str, skip: int = 0, limit: int = 100
    ) -> tuple[list[User], int]:
        return await self.user_repository.get(
            (col(User.username).ilike(f"%{search_username}%"),), skip=skip, limit=limit
        )
