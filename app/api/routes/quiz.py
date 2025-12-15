from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import (
    CurrentUser,
    get_quiz_service,
)
from app.domain.schemas.quiz import (
    QuizGenerateRequest,
    QuizRead,
    QuizReadDetail,
    QuizReadPublic,
    QuizResult,
    QuizSubmission,
)
from app.domain.services.quiz import QuizService

router = APIRouter()


@router.post(
    "/plan/{plan_id}/gen-quiz",
    response_model=QuizRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_quiz(
    plan_id: UUID,
    request: QuizGenerateRequest,
    current_user: CurrentUser,
    service: Annotated[QuizService, Depends(get_quiz_service)],
) -> QuizRead:
    try:
        quiz = await service.create_quiz(plan_id, current_user.id, request)
        return QuizRead.model_validate(quiz)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.get(
    "/{quiz_id}",
    response_model=QuizReadDetail,
)
async def get_quiz(
    quiz_id: UUID,
    current_user: CurrentUser,
    service: Annotated[QuizService, Depends(get_quiz_service)],
) -> QuizReadDetail:
    quiz = await service.get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found",
        )
    if quiz.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access quiz for another user",
        )
    return QuizReadDetail.model_validate(quiz)


@router.post(
    "/{quiz_id}/start",
    response_model=QuizReadPublic,
)
async def start_quiz(
    quiz_id: UUID,
    current_user: CurrentUser,
    service: Annotated[QuizService, Depends(get_quiz_service)],
) -> QuizReadPublic:
    try:
        quiz = await service.start_quiz(quiz_id, current_user.id)
        return QuizReadPublic.model_validate(quiz)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.post(
    "/{quiz_id}/submit",
    response_model=QuizResult,
)
async def submit_quiz(
    quiz_id: UUID,
    submission: QuizSubmission,
    current_user: CurrentUser,
    service: Annotated[QuizService, Depends(get_quiz_service)],
) -> QuizResult:
    try:
        quiz = await service.submit_answers(
            quiz_id, current_user.id, submission.answers
        )

        total_questions = len(quiz.questions)
        correct_answers = (
            int((quiz.score / 100) * total_questions) if quiz.score is not None else 0
        )
        passed = (quiz.score or 0) >= 75.0

        quiz_data = QuizRead.model_validate(quiz).model_dump()
        return QuizResult(
            **quiz_data,
            total_questions=total_questions,
            correct_answers=correct_answers,
            passed=passed,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.get(
    "/plan/{plan_id}/quizzes",
    response_model=list[QuizRead],
)
async def list_quizzes(
    plan_id: UUID,
    current_user: CurrentUser,
    service: Annotated[QuizService, Depends(get_quiz_service)],
) -> list[QuizRead]:
    quizzes = await service.list_quizzes(plan_id, current_user.id)
    return [QuizRead.model_validate(q) for q in quizzes]
