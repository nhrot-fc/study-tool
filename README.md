# Study Tool API

## Setup

1.  **Install dependencies**:
    ```bash
    uv sync
    ```

2.  **Run the application**:
    ```bash
    uv run fastapi dev app/main.py
    ```

## Project Structure

-   `app/api`: API endpoints (Routers)
-   `app/core`: Configuration and Database setup
-   `app/domain`: Pydantic schemas (DTOs)
-   `app/persistence/model`: SQLModel database tables
-   `app/persistence/repository`: Data access layer

## Features

-   **FastAPI**: High performance API
-   **SQLModel**: SQL databases with Python objects
-   **Async SQLite**: Simple yet powerful database
-   **Pydantic Settings**: Configuration management
