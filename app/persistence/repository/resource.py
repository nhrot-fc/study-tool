from sqlalchemy.ext.asyncio import AsyncSession

from app.persistence.model.resource import Resource
from app.persistence.repository.base import BaseRepository


class ResourceRepository(BaseRepository[Resource]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Resource)
