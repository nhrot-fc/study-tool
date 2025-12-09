from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlmodel import Field, Relationship

from app.domain.enums import CompletionStatus
from app.persistence.model.base import BaseEntity

if TYPE_CHECKING:
    from app.persistence.model.resource import Resource
    from app.persistence.model.section import Section
    from app.persistence.model.study_plan import StudyPlan
    from app.persistence.model.user import User


class StudyPlanProgress(BaseEntity, table=True):
    __tablename__ = "study_plan_progress"  # type: ignore

    status: CompletionStatus = Field(default=CompletionStatus.NOT_STARTED)
    progress: float = Field(default=0.0)  # 0.0 to 1.0
    completed_at: datetime | None = None

    user_id: UUID = Field(foreign_key="user.id")
    study_plan_id: UUID = Field(foreign_key="study_plan.id")

    user: "User" = Relationship(back_populates="study_plan_progresses")
    study_plan: "StudyPlan" = Relationship(back_populates="progresses")

    section_progresses: list["SectionProgress"] = Relationship(
        back_populates="study_plan_progress",
        sa_relationship_kwargs={"cascade": "all, delete"},
    )


class SectionProgress(BaseEntity, table=True):
    __tablename__ = "section_progress"  # type: ignore

    status: CompletionStatus = Field(default=CompletionStatus.NOT_STARTED)
    progress: float = Field(default=0.0)
    completed_at: datetime | None = None

    user_id: UUID = Field(foreign_key="user.id")
    section_id: UUID = Field(foreign_key="section.id")
    study_plan_progress_id: UUID = Field(foreign_key="study_plan_progress.id")

    user: "User" = Relationship(back_populates="section_progresses")
    section: "Section" = Relationship(back_populates="progresses")
    study_plan_progress: "StudyPlanProgress" = Relationship(
        back_populates="section_progresses"
    )

    resource_progresses: list["ResourceProgress"] = Relationship(
        back_populates="section_progress",
        sa_relationship_kwargs={"cascade": "all, delete"},
    )


class ResourceProgress(BaseEntity, table=True):
    __tablename__ = "resource_progress"  # type: ignore

    status: CompletionStatus = Field(default=CompletionStatus.NOT_STARTED)
    completed_at: datetime | None = None

    user_id: UUID = Field(foreign_key="user.id")
    resource_id: UUID = Field(foreign_key="resource.id")
    section_progress_id: UUID = Field(foreign_key="section_progress.id")

    user: "User" = Relationship(back_populates="resource_progresses")
    resource: "Resource" = Relationship(back_populates="progresses")
    section_progress: "SectionProgress" = Relationship(
        back_populates="resource_progresses"
    )
