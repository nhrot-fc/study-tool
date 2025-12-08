FROM python:3.12-slim-bookworm

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy the project definition
COPY pyproject.toml uv.lock ./

# Install the project's dependencies using the lockfile and settings
RUN uv sync --frozen --no-install-project --no-dev

# Add the rest of the project source code
COPY . .

# Install the project itself
RUN uv sync --frozen --no-dev

# Place executables in the environment at the front of the path
ENV PATH="/app/.venv/bin:$PATH"

# Run the service
CMD ["fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
