from sqlalchemy.ext.asyncio import AsyncSession

from app.persistence.model.section import Section
from app.persistence.repository.base import BaseRepository


class SectionRepository(BaseRepository[Section]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Section)
