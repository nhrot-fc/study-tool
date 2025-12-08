import logging
import logging.config

from app.core.config import get_settings


def setup_logging():
    settings = get_settings()

    # Define formatters
    formatters = {
        "standard": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "verbose": {
            "format": "%(asctime)s [%(levelname)s] %(name)s %(module)s:%(lineno)d - %(message)s",  # noqa: E501
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    }

    # Select formatter based on environment
    formatter_name = "verbose" if settings.ENVIRONMENT == "development" else "standard"

    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": formatters,
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": formatter_name,
                "level": settings.LOG_LEVEL,
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            "root": {
                "handlers": ["console"],
                "level": settings.LOG_LEVEL,
            },
            "app": {
                "handlers": ["console"],
                "level": settings.LOG_LEVEL,
                "propagate": False,
            },
            "uvicorn": {
                "handlers": ["console"],
                "level": "INFO",
                "propagate": False,
            },
            "sqlalchemy.engine": {
                "handlers": ["console"],
                "level": "INFO" if settings.DB_ECHO else "WARNING",
                "propagate": False,
            },
        },
    }

    logging.config.dictConfig(logging_config)
