from datetime import UTC, datetime
from uuid import UUID

from app.domain.schemas.quiz import QuestionUserSelectedOptions
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
            await self.quiz_repo.save(quiz)

        return quiz

    async def submit_answers(
        self, quiz_id: UUID, user_id: UUID, answers: list[QuestionUserSelectedOptions]
    ) -> Quiz:
        quiz = await self.quiz_repo.get_with_questions(quiz_id)
        self._validate_submission(quiz, user_id)
        assert quiz  # for type checker, validated above

        user_answers_map = self._map_user_answers(answers)

        # Persist user answers
        answers_to_save = self._prepare_answer_entities(quiz, user_answers_map)
        if answers_to_save:
            await self.quiz_repo.save_answers(answers_to_save)

        # Update quiz state
        quiz.score = self._calculate_score(quiz, user_answers_map)
        quiz.completed_at = datetime.now(UTC)

        return await self.quiz_repo.save(quiz)

    def _validate_submission(self, quiz: Quiz | None, user_id: UUID) -> None:
        if not quiz:
            raise ValueError("Quiz not found")
        if quiz.user_id != user_id:
            raise ValueError("Not authorized")
        if quiz.completed_at:
            raise ValueError("Quiz already completed")

    def _map_user_answers(
        self, answers: list[QuestionUserSelectedOptions]
    ) -> dict[UUID, set[UUID]]:
        user_answers_map: dict[UUID, set[UUID]] = {}
        for answer in answers:
            if answer.question_id not in user_answers_map:
                user_answers_map[answer.question_id] = set()
            user_answers_map[answer.question_id].add(answer.selected_option_id)
        return user_answers_map

    def _calculate_score(
        self, quiz: Quiz, user_answers_map: dict[UUID, set[UUID]]
    ) -> float:
        correct_count = 0
        total_questions = len(quiz.questions)

        for question in quiz.questions:
            correct_option_ids = {o.id for o in question.options if o.is_correct}
            user_selected_ids = user_answers_map.get(question.id, set())
            if correct_option_ids and correct_option_ids == user_selected_ids:
                correct_count += 1

        return (correct_count / total_questions) * 100 if total_questions > 0 else 0.0

    def _prepare_answer_entities(
        self, quiz: Quiz, user_answers_map: dict[UUID, set[UUID]]
    ) -> list[QuizUserAnswer]:
        question_map = {q.id: q for q in quiz.questions}
        answers_to_save = []

        for q_id, option_ids in user_answers_map.items():
            if q_id not in question_map:
                continue

            for opt_id in option_ids:
                answers_to_save.append(
                    QuizUserAnswer(
                        quiz_id=quiz.id,
                        question_id=q_id,
                        selected_option_id=opt_id,
                    )
                )
        return answers_to_save

    async def list_quizzes(self, study_plan_id: UUID, user_id: UUID) -> list[Quiz]:
        return await self.quiz_repo.list_by_plan_and_user(study_plan_id, user_id)
