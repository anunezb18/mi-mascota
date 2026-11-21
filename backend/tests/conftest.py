"""Configuración compartida de pytest."""

import os

# Debe definirse antes de importar la app (JWT_SECRET_KEY es obligatorio)
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key")

import pytest  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture
async def client() -> AsyncClient:
    """Cliente HTTP contra la app en memoria (no ejecuta el lifespan ni abre conexiones)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
