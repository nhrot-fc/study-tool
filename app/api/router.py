from fastapi import APIRouter

from app.api.routes import auth, health, progress, study_plan, user

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(user.router, prefix="/users", tags=["users"])
api_router.include_router(
    study_plan.router, prefix="/study-plans", tags=["study-plans"]
)
api_router.include_router(progress.router, prefix="/progress", tags=["progress"])
