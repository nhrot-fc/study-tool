from typing import Any


class DomainException(Exception):
    """Base class for all domain exceptions"""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        details: dict[str, Any] | None = None,
    ):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class NotFoundException(DomainException):
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(message, code="NOT_FOUND", details=details)


class AlreadyExistsException(DomainException):
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(message, code="ALREADY_EXISTS", details=details)


class InvalidOperationException(DomainException):
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(message, code="INVALID_OPERATION", details=details)


class UnauthorizedException(DomainException):
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(message, code="UNAUTHORIZED", details=details)
