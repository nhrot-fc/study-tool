from enum import StrEnum


class CompletionStatus(StrEnum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class ResourceType(StrEnum):
    VIDEO = "video"
    ARTICLE = "article"
    BOOK = "book"
    BLOG = "blog"
    DOCUMENTATION = "documentation"
    REPOSITORY = "repository"
