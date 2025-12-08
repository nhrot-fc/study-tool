from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship

from app.domain.enums import ResourceType
from app.persistence.model.base import BaseEntity
from app.persistence.model.links import SectionResourceLink, StudyPlanResourceLink

if TYPE_CHECKING:
    from app.persistence.model.section import Section
    from app.persistence.model.study_plan import StudyPlan


class Resource(BaseEntity, table=True):
    __tablename__ = "resource"  # type: ignore

    title: str = Field(index=True)
    url: str
    type: ResourceType
    description: str | None = None
    duration_minutes: int | None = None

    study_plans: list["StudyPlan"] = Relationship(
        back_populates="resources", link_model=StudyPlanResourceLink
    )
    sections: list["Section"] = Relationship(
        back_populates="resources", link_model=SectionResourceLink
    )
