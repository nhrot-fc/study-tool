from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.domain.enums import ResourceType


class ResourceBase(BaseModel):
    title: str
    type: ResourceType
    url: str | None = None
    description: str | None = None
    duration_minutes: int | None = None


class ResourceCreate(ResourceBase):
    pass


class ResourceUpsert(ResourceCreate):
    id: UUID | None = None


class ResourceRead(ResourceBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)
