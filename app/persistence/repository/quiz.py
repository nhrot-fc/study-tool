from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import col

from app.persistence.model.quiz import Question, Quiz, QuizUserAnswer
from app.persistence.repository.base import BaseRepository


class QuizRepository(BaseRepository[Quiz]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Quiz)

    async def save(self, quiz: Quiz) -> Quiz:
        self.session.add(quiz)
        await self.session.commit()
        await self.session.refresh(quiz)
        return quiz

    async def save_answers(self, answers: list[QuizUserAnswer]) -> None:
        self.session.add_all(answers)
        await self.session.commit()

    async def get_by_plan_and_user(self, plan_id: UUID, user_id: UUID) -> Quiz | None:
        statement = (
            select(Quiz)
            .where(col(Quiz.study_plan_id) == plan_id, col(Quiz.user_id) == user_id)
            .options(selectinload(Quiz.questions).selectinload(Question.options))  # type: ignore
        )
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def get_with_questions(self, quiz_id: UUID) -> Quiz | None:
        statement = (
            select(Quiz)
            .where(col(Quiz.id) == quiz_id)
            .options(
                selectinload(Quiz.questions).selectinload(Question.options),  # type: ignore
                selectinload(Quiz.user_answers),  # type: ignore
            )
        )
        result = await self.session.execute(statement)
        return result.scalars().first()

    async def list_by_plan_and_user(self, plan_id: UUID, user_id: UUID) -> list[Quiz]:
        statement = (
            select(Quiz)
            .where(col(Quiz.study_plan_id) == plan_id, col(Quiz.user_id) == user_id)
            .order_by(col(Quiz.created_at).desc())
        )
        result = await self.session.execute(statement)
        return list(result.scalars().all())
