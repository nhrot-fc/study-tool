from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import col

from app.persistence.model.section import Section
from app.persistence.repository.base import BaseRepository


class SectionRepository(BaseRepository[Section]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Section)

    async def get_with_details(self, id: UUID) -> Section | None:
        statement = (
            select(Section)
            .where(col(Section.id) == id)
            .options(
                selectinload(Section.resources),  # type: ignore
                selectinload(Section.children),  # type: ignore
            )
        )
        result = await self.session.execute(statement)
        return result.scalars().first()
