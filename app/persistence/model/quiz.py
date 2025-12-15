from datetime import UTC, datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlmodel import Field, Relationship

from app.persistence.model.base import BaseEntity

if TYPE_CHECKING:
    from app.persistence.model.study_plan import StudyPlan
    from app.persistence.model.user import User


class Quiz(BaseEntity, table=True):
    __tablename__ = "quiz"  # type: ignore
    study_plan_id: UUID = Field(foreign_key="study_plan.id")
    user_id: UUID = Field(foreign_key="user.id")
    title: str
    difficulty: float
    duration_minutes: int

    # Attempts attributes
    session_token: str | None = Field(index=True, default=None)
    started_at: datetime | None = Field(default_factory=lambda: datetime.now(UTC))
    completed_at: datetime | None = None
    score: float | None = None

    # Relationships
    study_plan: "StudyPlan" = Relationship(back_populates="quizzes")
    user: "User" = Relationship(back_populates="quizzes")
    questions: list["Question"] = Relationship(
        back_populates="quiz", sa_relationship_kwargs={"cascade": "all, delete"}
    )
    user_answers: list["QuizUserAnswer"] = Relationship(
        back_populates="quiz", sa_relationship_kwargs={"cascade": "all, delete"}
    )


class Question(BaseEntity, table=True):
    __tablename__ = "question"  # type: ignore
    quiz_id: UUID | None = Field(foreign_key="quiz.id", default=None, index=True)
    title: str
    description: str
    order: int

    # Relationships
    quiz: Quiz = Relationship(back_populates="questions")
    options: list["QuestionOption"] = Relationship(
        back_populates="question", sa_relationship_kwargs={"cascade": "all, delete"}
    )


class QuestionOption(BaseEntity, table=True):
    __tablename__ = "question_option"  # type: ignore
    question_id: UUID | None = Field(
        foreign_key="question.id", default=None, index=True
    )
    text: str
    is_correct: bool

    # Relationships
    question: Question = Relationship(back_populates="options")


class QuizUserAnswer(BaseEntity, table=True):
    __tablename__ = "quiz_user_answer"  # type: ignore
    quiz_id: UUID = Field(foreign_key="quiz.id")
    question_id: UUID = Field(foreign_key="question.id")
    selected_option_id: UUID = Field(foreign_key="question_option.id")

    # Relationships
    quiz: Quiz = Relationship(back_populates="user_answers")
