from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.domain.schemas.resource import ResourceCreate, ResourceRead
from app.domain.schemas.section import SectionCreate, SectionRead


class StudyPlanBase(BaseModel):
    title: str
    description: str


class StudyPlanProposal(StudyPlanBase):
    sections: list[SectionCreate] = []
    resources: list[ResourceCreate] = []


class StudyPlanCreate(StudyPlanProposal):
    user_id: UUID


class StudyPlanRead(StudyPlanBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    forked_from_id: UUID | None = None
    # Metadata only, no sections/resources

    model_config = ConfigDict(from_attributes=True)


class StudyPlanReadDetail(StudyPlanRead):
    sections: list[SectionRead] = []
    resources: list[ResourceRead] = []


class StudyPlanGenerateRequest(BaseModel):
    topic: str
    level: str = "Beginner"
    goals: str | None = None
