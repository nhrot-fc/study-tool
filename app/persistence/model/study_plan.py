from typing import TYPE_CHECKING
from uuid import UUID

from sqlmodel import Field, Relationship

from app.persistence.model.base import BaseEntity
from app.persistence.model.links import StudyPlanResourceLink

if TYPE_CHECKING:
    from app.persistence.model.progress import StudyPlanProgress
    from app.persistence.model.quiz import Quiz
    from app.persistence.model.resource import Resource
    from app.persistence.model.section import Section
    from app.persistence.model.user import User


class StudyPlan(BaseEntity, table=True):
    __tablename__ = "study_plan"  # type: ignore

    title: str
    description: str

    user_id: UUID = Field(foreign_key="user.id")
    user: "User" = Relationship(back_populates="study_plans")

    forked_from_id: UUID | None = Field(default=None, foreign_key="study_plan.id")
    forked_from: "StudyPlan" = Relationship(
        sa_relationship_kwargs={"remote_side": "StudyPlan.id"}
    )

    sections: list["Section"] = Relationship(back_populates="study_plan")
    resources: list["Resource"] = Relationship(
        back_populates="study_plans", link_model=StudyPlanResourceLink
    )
    quizzes: list["Quiz"] = Relationship(back_populates="study_plan")

    progresses: list["StudyPlanProgress"] = Relationship(back_populates="study_plan")
