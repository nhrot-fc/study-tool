from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from app.domain.exceptions.base import InvalidOperationException
from app.persistence.model.quiz import Quiz
from app.persistence.model.study_plan import StudyPlan
from app.persistence.model.user import User


@pytest.mark.asyncio
async def test_submit_answers_expired(quiz_service, session):
    # Setup
    user = User(email="expired@example.com", username="expired", hashed_password="pw")
    session.add(user)
    await session.commit()

    study_plan = StudyPlan(user_id=user.id, title="Plan", description="Desc")
    session.add(study_plan)
    await session.commit()

    # Create expired quiz
    # Started 20 mins ago, duration 10 mins
    started_at = datetime.now(UTC) - timedelta(minutes=20)
    quiz = Quiz(
        study_plan_id=study_plan.id,
        user_id=user.id,
        title="Expired Quiz",
        difficulty=1.0,
        duration_minutes=10,
        started_at=started_at
    )
    session.add(quiz)
    await session.commit()

    # Submit answers
    # Should NOT raise InvalidOperationException
    try:
        result = await quiz_service.submit_answers(quiz.id, user.id, [])
        assert result.completed_at is not None
        assert result.score is not None
    except InvalidOperationException:
        pytest.fail("Should not raise for expired quiz submission")

@pytest.mark.asyncio
async def test_quiz_is_expired_property():
    # Setup
    quiz = Quiz(
        study_plan_id=uuid4(),
        user_id=uuid4(),
        title="Expired Quiz",
        difficulty=1.0,
        duration_minutes=10,
        started_at=datetime.now(UTC) - timedelta(minutes=20)
    )
    assert quiz.is_expired is True

    quiz_active = Quiz(
        study_plan_id=uuid4(),
        user_id=uuid4(),
        title="Active Quiz",
        difficulty=1.0,
        duration_minutes=10,
        started_at=datetime.now(UTC) - timedelta(minutes=5)
    )
    assert quiz_active.is_expired is False
