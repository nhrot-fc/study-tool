from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.domain.schemas.progress import StudyPlanProgressRead
from app.domain.schemas.resource import ResourceCreate, ResourceRead
from app.domain.schemas.section import SectionCreate, SectionRead, SectionUpsert


class StudyPlanBase(BaseModel):
    title: str
    description: str


class StudyPlanProposal(StudyPlanBase):
    sections: list[SectionCreate] = []
    resources: list[ResourceCreate] = []


class StudyPlanCreate(StudyPlanProposal):
    user_id: UUID


class StudyPlanUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    sections: list[SectionUpsert] | None = None


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


class StudyPlanReadDetailWithProgress(StudyPlanReadDetail):
    progress: StudyPlanProgressRead | None = None


class StudyPlanGenerateRequest(BaseModel):
    message: str
    topic: str | None = None
    proposal: StudyPlanProposal | None = None
