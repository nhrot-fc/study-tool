from typing import TYPE_CHECKING

from pydantic import EmailStr
from sqlmodel import Field, Relationship

from app.persistence.model.base import BaseEntity

if TYPE_CHECKING:
    from app.persistence.model.study_plan import StudyPlan
    from app.persistence.model.token import RefreshToken


class User(BaseEntity, table=True):
    __tablename__ = "user"  # type: ignore

    email: EmailStr = Field(unique=True, index=True, max_length=255)
    username: str
    hashed_password: str
    is_active: bool = True

    refresh_tokens: list["RefreshToken"] = Relationship(back_populates="user")
    study_plans: list["StudyPlan"] = Relationship(back_populates="user")
