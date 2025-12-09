from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from app.persistence.model.token import RefreshToken
from app.persistence.repository.base import BaseRepository


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, RefreshToken)

    async def get_by_token(self, token: str) -> RefreshToken | None:
        statement = select(RefreshToken).where(col(RefreshToken.token) == token)
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def revoke_all_for_user(self, user_id: UUID) -> None:
        statement = (
            update(RefreshToken)
            .where(col(RefreshToken.user_id) == user_id)
            .where(col(RefreshToken.revoked_at).is_(None))
            .values(revoked_at=datetime.now(UTC))
        )
        await self.session.execute(statement)
        await self.session.commit()
