import pytest

from app.domain.schemas.quiz import QuestionUserSelectedOptions
from app.persistence.model.quiz import Question, QuestionOption, Quiz
from app.persistence.model.study_plan import StudyPlan
from app.persistence.model.user import User


@pytest.mark.asyncio
async def test_submit_answers_multiple_correct_options(quiz_service, session):
    # 1. Setup User and StudyPlan
    user = User(
        email="test_quiz_multi@example.com", username="testuser", hashed_password="pw"
    )
    session.add(user)
    await session.commit()

    study_plan = StudyPlan(user_id=user.id, title="Plan", description="Desc")
    session.add(study_plan)
    await session.commit()

    # Helper to create a quiz with one question having multiple correct options
    async def create_quiz_scenario():
        quiz = Quiz(
            study_plan_id=study_plan.id,
            user_id=user.id,
            title="Quiz Multi",
            difficulty=1.0,
            duration_minutes=10,
        )
        session.add(quiz)
        await session.commit()

        question = Question(quiz_id=quiz.id, title="Q1", description="Desc", order=1)
        session.add(question)
        await session.commit()

        opt1 = QuestionOption(
            question_id=question.id, text="Correct 1", is_correct=True
        )
        opt2 = QuestionOption(
            question_id=question.id, text="Correct 2", is_correct=True
        )
        opt3 = QuestionOption(question_id=question.id, text="Wrong 1", is_correct=False)
        session.add_all([opt1, opt2, opt3])
        await session.commit()

        return quiz, question, opt1, opt2, opt3

    # Scenario 1: All correct options selected -> 100% score
    quiz1, q1, o1, o2, o3 = await create_quiz_scenario()
    answers1 = [
        QuestionUserSelectedOptions(question_id=q1.id, selected_option_id=o1.id),
        QuestionUserSelectedOptions(question_id=q1.id, selected_option_id=o2.id),
    ]
    result1 = await quiz_service.submit_answers(quiz1.id, user.id, answers1)
    assert result1.score == 100.0

    # Scenario 2: Only one correct option selected -> 0% score
    quiz2, q2, o1_2, o2_2, o3_2 = await create_quiz_scenario()
    answers2 = [
        QuestionUserSelectedOptions(question_id=q2.id, selected_option_id=o1_2.id),
    ]
    result2 = await quiz_service.submit_answers(quiz2.id, user.id, answers2)
    assert result2.score == 0.0

    # Scenario 3: Correct options + Wrong option selected -> 0% score
    quiz3, q3, o1_3, o2_3, o3_3 = await create_quiz_scenario()
    answers3 = [
        QuestionUserSelectedOptions(question_id=q3.id, selected_option_id=o1_3.id),
        QuestionUserSelectedOptions(question_id=q3.id, selected_option_id=o2_3.id),
        QuestionUserSelectedOptions(question_id=q3.id, selected_option_id=o3_3.id),
    ]
    result3 = await quiz_service.submit_answers(quiz3.id, user.id, answers3)
    assert result3.score == 0.0

    # Scenario 4: Wrong option selected -> 0% score
    quiz4, q4, o1_4, o2_4, o3_4 = await create_quiz_scenario()
    answers4 = [
        QuestionUserSelectedOptions(question_id=q4.id, selected_option_id=o3_4.id),
    ]
    result4 = await quiz_service.submit_answers(quiz4.id, user.id, answers4)
    assert result4.score == 0.0
