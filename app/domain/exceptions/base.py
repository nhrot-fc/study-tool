from typing import Any


class DomainException(Exception):
    """Base class for all domain exceptions"""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        detail: dict[str, Any] | None = None,
    ):
        self.message = message
        self.code = code
        self.detail = detail or {}
        super().__init__(self.message)


class NotFoundException(DomainException):
    def __init__(self, message: str, detail: dict[str, Any] | None = None):
        super().__init__(message, code="NOT_FOUND", detail=detail)


class AlreadyExistsException(DomainException):
    def __init__(self, message: str, detail: dict[str, Any] | None = None):
        super().__init__(message, code="ALREADY_EXISTS", detail=detail)


class InvalidOperationException(DomainException):
    def __init__(self, message: str, detail: dict[str, Any] | None = None):
        super().__init__(message, code="INVALID_OPERATION", detail=detail)


class UnauthorizedException(DomainException):
    def __init__(self, message: str, detail: dict[str, Any] | None = None):
        super().__init__(message, code="UNAUTHORIZED", detail=detail)
