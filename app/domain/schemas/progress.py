from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.domain.enums import CompletionStatus


class ResourceProgressBase(BaseModel):
    status: CompletionStatus
    completed_at: datetime | None = None


class ResourceProgressRead(ResourceProgressBase):
    id: UUID
    resource_id: UUID
    section_progress_id: UUID

    model_config = ConfigDict(from_attributes=True)


class SectionProgressBase(BaseModel):
    status: CompletionStatus
    progress: float
    completed_at: datetime | None = None


class SectionProgressRead(SectionProgressBase):
    id: UUID
    section_id: UUID
    study_plan_progress_id: UUID
    resource_progresses: list[ResourceProgressRead] = []

    model_config = ConfigDict(from_attributes=True)


class StudyPlanProgressBase(BaseModel):
    status: CompletionStatus
    progress: float
    completed_at: datetime | None = None


class StudyPlanProgressRead(StudyPlanProgressBase):
    id: UUID
    study_plan_id: UUID
    user_id: UUID
    section_progresses: list[SectionProgressRead] = []

    model_config = ConfigDict(from_attributes=True)
