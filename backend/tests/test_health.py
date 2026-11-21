"""Pruebas del endpoint /health simulando las bases de datos."""

from app.cache import client as redis_client
from app.db.mongo import client as mongo_client
from app.db.postgres import session as postgres_session


async def _ok() -> None:
    return None


async def _fail() -> None:
    raise ConnectionError("sin conexión")


async def test_health_all_services_ok(client, monkeypatch):
    monkeypatch.setattr(postgres_session, "ping", _ok)
    monkeypatch.setattr(mongo_client, "ping", _ok)
    monkeypatch.setattr(redis_client, "ping", _ok)

    response = await client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert set(body["services"]) == {"postgres", "mongodb", "redis"}


async def test_health_reports_degraded_when_a_service_fails(client, monkeypatch):
    monkeypatch.setattr(postgres_session, "ping", _ok)
    monkeypatch.setattr(mongo_client, "ping", _fail)
    monkeypatch.setattr(redis_client, "ping", _ok)

    response = await client.get("/health")

    assert response.status_code == 503
    body = response.json()
    assert body["status"] == "degraded"
    assert body["services"]["mongodb"]["status"] == "error"
    assert body["services"]["postgres"]["status"] == "ok"
