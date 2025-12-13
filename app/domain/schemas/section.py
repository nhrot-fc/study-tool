from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.domain.schemas.resource import ResourceCreate, ResourceRead, ResourceUpsert


class SectionBase(BaseModel):
    title: str
    description: str | None = None
    order: int = 0


class SectionCreate(SectionBase):
    resources: list[ResourceCreate] = []
    children: list["SectionCreate"] = []


class SectionUpsert(SectionBase):
    id: UUID | None = None
    resources: list["ResourceUpsert"] = []
    children: list["SectionUpsert"] = []


class SectionRead(SectionBase):
    id: UUID
    resources: list[ResourceRead] = []
    children: list["SectionRead"] = []

    model_config = ConfigDict(from_attributes=True)


class SectionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    order: int | None = None
