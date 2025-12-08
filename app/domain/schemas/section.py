from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.domain.enums import CompletionStatus
from app.domain.schemas.resource import ResourceCreate, ResourceRead


class SectionBase(BaseModel):
    title: str
    description: str | None = None
    order: int = 0
    notes: str | None = None


class SectionCreate(SectionBase):
    resources: list[ResourceCreate] = []
    children: list["SectionCreate"] = []


class SectionRead(SectionBase):
    id: UUID
    status: CompletionStatus
    progress: float
    resources: list[ResourceRead] = []
    children: list["SectionRead"] = []

    model_config = ConfigDict(from_attributes=True)


class SectionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    order: int | None = None
    status: CompletionStatus | None = None
    notes: str | None = None
