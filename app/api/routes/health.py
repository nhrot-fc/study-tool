from typing import Any

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text

from app.core.dependencies import SessionDep

router = APIRouter()


@router.get("/", status_code=status.HTTP_200_OK)
async def health_check(
    session: SessionDep,
) -> Any:
    """
    Health check endpoint.
    Checks database connectivity.
    """
    try:
        await session.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {e!s}",
        ) from e
