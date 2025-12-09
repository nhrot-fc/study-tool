from typing import TYPE_CHECKING
from uuid import UUID

from sqlmodel import Field, Relationship

from app.persistence.model.base import BaseEntity
from app.persistence.model.links import SectionResourceLink

if TYPE_CHECKING:
    from app.persistence.model.progress import SectionProgress
    from app.persistence.model.resource import Resource
    from app.persistence.model.study_plan import StudyPlan


class Section(BaseEntity, table=True):
    __tablename__ = "section"  # type: ignore

    title: str
    description: str | None = None
    order: int = 0

    # Foreign Keys
    study_plan_id: UUID | None = Field(default=None, foreign_key="study_plan.id")
    parent_id: UUID | None = Field(default=None, foreign_key="section.id")

    # Relationships
    study_plan: "StudyPlan" = Relationship(back_populates="sections")
    parent: "Section" = Relationship(
        back_populates="children", sa_relationship_kwargs={"remote_side": "Section.id"}
    )
    children: list["Section"] = Relationship(back_populates="parent")

    resources: list["Resource"] = Relationship(
        back_populates="sections", link_model=SectionResourceLink
    )

    progresses: list["SectionProgress"] = Relationship(back_populates="section")
