from uuid import UUID

from sqlmodel import Field, SQLModel


class StudyPlanResourceLink(SQLModel, table=True):
    study_plan_id: UUID = Field(foreign_key="study_plan.id", primary_key=True)
    resource_id: UUID = Field(foreign_key="resource.id", primary_key=True)


class SectionResourceLink(SQLModel, table=True):
    section_id: UUID = Field(foreign_key="section.id", primary_key=True)
    resource_id: UUID = Field(foreign_key="resource.id", primary_key=True)
