from typing import TYPE_CHECKING

from sqlmodel import Relationship

from app.persistence.model.base import BaseEntity
from app.persistence.model.links import StudyPlanResourceLink

if TYPE_CHECKING:
    from app.persistence.model.resource import Resource
    from app.persistence.model.section import Section


class StudyPlan(BaseEntity, table=True):
    __tablename__ = "study_plan"  # type: ignore

    title: str
    description: str

    sections: list["Section"] = Relationship(back_populates="study_plan")
    resources: list["Resource"] = Relationship(
        back_populates="study_plans", link_model=StudyPlanResourceLink
    )
