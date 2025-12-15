from typing import Any, TypeVar

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel, col

from app.persistence.model.base import BaseEntity

ModelType = TypeVar("ModelType", bound=BaseEntity)


class BaseRepository[ModelType: BaseEntity]:
    def __init__(self, session: AsyncSession, model: type[ModelType]):
        self.session = session
        self.model = model

    async def create(self, obj_in: ModelType) -> ModelType:
        self.session.add(obj_in)
        await self.session.commit()
        await self.session.refresh(obj_in)
        return obj_in

    async def get_by_id(self, id: Any) -> ModelType | None:
        return await self.session.get(self.model, id)

    async def get(
        self, *where_clauses: Any, skip: int = 0, limit: int = 100
    ) -> tuple[list[ModelType], int]:
        # Get items
        statement = select(self.model).where(*where_clauses).offset(skip).limit(limit)
        result = await self.session.execute(statement)
        items = result.scalars().all()

        # Get total count
        count_statement = (
            select(func.count()).select_from(self.model).where(*where_clauses)
        )
        count_result = await self.session.execute(count_statement)
        total = count_result.scalar_one()

        return list(items), total

    async def update(
        self, db_obj: ModelType, obj_in: dict[str, Any] | SQLModel
    ) -> ModelType:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def delete(self, id: Any) -> bool:
        db_obj = await self.get_by_id(id)
        if db_obj:
            await self.session.delete(db_obj)
            await self.session.commit()
            return True
        return False

    async def delete_by_ids(self, ids: list[Any]) -> None:
        if not ids:
            return
        statement = delete(self.model).where(col(self.model.id).in_(ids))
        await self.session.execute(statement)
        await self.session.commit()

    async def soft_delete(self, db_obj: ModelType) -> None:
        db_obj.active = False
        self.session.add(db_obj)
        await self.session.commit()
