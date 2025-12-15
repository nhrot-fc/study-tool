from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.domain.schemas.study_plan import StudyPlanReadDetail


class QuestionOptionBase(BaseModel):
    text: str
    is_correct: bool = False


class QuestionOptionCreate(QuestionOptionBase):
    pass


class QuestionOptionRead(QuestionOptionBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)


class QuestionOptionPublic(BaseModel):
    id: UUID
    text: str
    model_config = ConfigDict(from_attributes=True)


class QuestionBase(BaseModel):
    title: str
    description: str
    order: int


class QuestionCreate(QuestionBase):
    options: list[QuestionOptionCreate]


class QuestionRead(QuestionBase):
    id: UUID
    options: list[QuestionOptionRead]
    model_config = ConfigDict(from_attributes=True)


class QuestionPublic(QuestionBase):
    id: UUID
    options: list[QuestionOptionPublic]
    model_config = ConfigDict(from_attributes=True)


class QuizBase(BaseModel):
    title: str
    difficulty: float
    duration_minutes: int


class QuizProposal(QuizBase):
    questions: list[QuestionCreate]


class QuizCreate(QuizProposal):
    study_plan_id: UUID
    user_id: UUID


class QuizRead(QuizBase):
    id: UUID
    study_plan_id: UUID
    user_id: UUID
    started_at: datetime | None
    completed_at: datetime | None
    score: float | None

    model_config = ConfigDict(from_attributes=True)


class QuizReadDetail(QuizRead):
    questions: list[QuestionRead]


class QuizReadPublic(QuizRead):
    questions: list[QuestionPublic]


class QuestionUserSelectedOptions(BaseModel):
    question_id: UUID
    selected_option_id: UUID


class QuizSubmission(BaseModel):
    answers: list[QuestionUserSelectedOptions]


class QuizResult(QuizRead):
    total_questions: int
    correct_answers: int
    passed: bool


class QuizGenerateRequest(BaseModel):
    ignore_base_prompt: bool
    study_plan: StudyPlanReadDetail
    num_questions: int
    difficulty: float
    extra_instructions: str
