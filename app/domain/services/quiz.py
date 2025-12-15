import secrets
from datetime import UTC, datetime
from uuid import UUID

from app.domain.schemas.quiz import QuizAnswerCreate
from app.domain.services.gemini import GeminiService
from app.persistence.model.quiz import Question, QuestionOption, Quiz, QuizUserAnswer
from app.persistence.repository.quiz import QuizRepository
from app.persistence.repository.study_plan import StudyPlanRepository


class QuizService:
    def __init__(
        self,
        quiz_repo: QuizRepository,
        study_plan_repo: StudyPlanRepository,
        gemini_service: GeminiService,
    ):
        self.quiz_repo = quiz_repo
        self.study_plan_repo = study_plan_repo
        self.gemini_service = gemini_service

    async def create_quiz(self, study_plan_id: UUID, user_id: UUID) -> Quiz:
        existing = await self.quiz_repo.get_by_plan_and_user(study_plan_id, user_id)
        if existing:
            return existing

        study_plan = await self.study_plan_repo.get_by_id(study_plan_id)
        if not study_plan:
            raise ValueError("Study plan not found")

        topic = f"{study_plan.title}: {study_plan.description}"
        proposal = self.gemini_service.generate_quiz_proposal(
            instructions="Create a quiz to test understanding of this study plan.",
            topic=topic,
            num_questions=5,
        )
        if not proposal:
            raise ValueError("Failed to generate quiz")

        quiz = Quiz(
            study_plan_id=study_plan_id,
            user_id=user_id,
            title=proposal.title,
            difficulty=proposal.difficulty,
            duration_minutes=proposal.duration_minutes,
            session_token=secrets.token_urlsafe(32),
            started_at=None,
        )

        for q_prop in proposal.questions:
            question = Question(
                title=q_prop.title, description=q_prop.description, order=q_prop.order
            )
            for o_prop in q_prop.options:
                option = QuestionOption(text=o_prop.text, is_correct=o_prop.is_correct)
                question.options.append(option)
            quiz.questions.append(question)

        return await self.quiz_repo.create(quiz)

    async def get_quiz(self, quiz_id: UUID) -> Quiz | None:
        return await self.quiz_repo.get_with_questions(quiz_id)

    async def start_quiz(self, quiz_id: UUID, user_id: UUID) -> Quiz:
        quiz = await self.quiz_repo.get_with_questions(quiz_id)
        if not quiz:
            raise ValueError("Quiz not found")
        if quiz.user_id != user_id:
            raise ValueError("Not authorized")

        if not quiz.started_at:
            quiz.started_at = datetime.now(UTC)
            self.quiz_repo.session.add(quiz)
            await self.quiz_repo.session.commit()

        return quiz

    async def submit_answers(
        self, quiz_id: UUID, user_id: UUID, answers: list[QuizAnswerCreate]
    ) -> Quiz:
        quiz = await self.quiz_repo.get_with_questions(quiz_id)
        if not quiz:
            raise ValueError("Quiz not found")
        if quiz.user_id != user_id:
            raise ValueError("Not authorized")

        if quiz.completed_at:
            raise ValueError("Quiz already completed")

        correct_count = 0
        total_questions = len(quiz.questions)

        # Create a map for quick lookup
        question_map = {q.id: q for q in quiz.questions}

        for answer in answers:
            question = question_map.get(answer.question_id)
            if not question:
                continue

            selected_option = next(
                (o for o in question.options if o.id == answer.selected_option_id), None
            )
            if selected_option and selected_option.is_correct:
                correct_count += 1

            # Save answer
            user_answer = QuizUserAnswer(
                quiz_id=quiz.id,
                question_id=answer.question_id,
                selected_option_id=answer.selected_option_id,
            )
            self.quiz_repo.session.add(user_answer)

        score = (correct_count / total_questions) * 100 if total_questions > 0 else 0
        quiz.score = score
        quiz.completed_at = datetime.now(UTC)

        self.quiz_repo.session.add(quiz)
        await self.quiz_repo.session.commit()
        return quiz

    async def list_quizzes(self, study_plan_id: UUID, user_id: UUID) -> list[Quiz]:
        return await self.quiz_repo.list_by_plan_and_user(study_plan_id, user_id)
