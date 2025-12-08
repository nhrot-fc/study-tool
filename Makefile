.PHONY: dev build docker-run test format sync

dev:
	uv run fastapi dev app/main.py --host 0.0.0.0 --port 8000

build:
	docker build -t study-tool .

docker-run:
	docker run -p 8000:8000 study-tool

test:
	uv run pytest

format:
	uv run ruff format .
	uv run ruff check --fix .

sync:
	uv sync
