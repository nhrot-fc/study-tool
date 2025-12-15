from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from app.api.exception_handlers import (
    domain_exception_handler,
    pydantic_validation_exception_handler,
)
from app.api.router import api_router
from app.core.config import get_settings
from app.core.database import init_db
from app.core.logging import setup_logging
from app.domain.exceptions.base import DomainException

settings = get_settings()
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    # Startup
    await init_db()
    yield
    # Shutdown
    pass


app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.add_exception_handler(DomainException, domain_exception_handler)
app.add_exception_handler(ValidationError, pydantic_validation_exception_handler)

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {"message": "Welcome to Study Tool API"}
