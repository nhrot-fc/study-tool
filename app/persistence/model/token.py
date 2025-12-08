from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlmodel import Field, Relationship

from app.persistence.model.base import BaseEntity

if TYPE_CHECKING:
    from app.persistence.model.user import User


class RefreshToken(BaseEntity, table=True):
    __tablename__ = "refresh_token"  # type: ignore

    token: str = Field(index=True, unique=True)
    expires_at: datetime
    revoked_at: datetime | None = None

    user_id: UUID = Field(foreign_key="user.id")
    user: "User" = Relationship(back_populates="refresh_tokens")
