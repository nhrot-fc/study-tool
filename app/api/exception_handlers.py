from fastapi import Request, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.domain.exceptions.base import (
    AlreadyExistsException,
    DomainException,
    InvalidOperationException,
    NotFoundException,
    UnauthorizedException,
)


async def domain_exception_handler(_request: Request, exc: DomainException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

    if isinstance(exc, NotFoundException):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(exc, AlreadyExistsException):
        status_code = status.HTTP_409_CONFLICT
    elif isinstance(exc, InvalidOperationException):
        status_code = status.HTTP_400_BAD_REQUEST
    elif isinstance(exc, UnauthorizedException):
        status_code = status.HTTP_401_UNAUTHORIZED

    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            }
        },
    )


async def pydantic_validation_exception_handler(
    _request: Request, exc: ValidationError
):
    """
    Handle validation errors that occur when manually instantiating Pydantic models.
    This is different from FastAPI's RequestValidationError
    which handles request body validation.
    """
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Validation error",
                "details": exc.errors(include_url=False),
            }
        },
    )
