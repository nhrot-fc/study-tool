from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.persistence.model.user import User
from app.persistence.repository.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, User)

    async def get_by_email(self, email: str) -> User | None:
        statement = select(User).where(User.email == email)  # type: ignore
        result = await self.session.execute(statement)
        return result.scalars().first()
