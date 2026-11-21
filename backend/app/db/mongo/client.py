"""Cliente de MongoDB. Se abre y cierra en el lifespan de FastAPI (app/main.py)."""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

_client: AsyncIOMotorClient | None = None


async def connect() -> None:
    """Crea el cliente. Motor se conecta de forma perezosa (en la primera operación)."""
    global _client
    _client = AsyncIOMotorClient(
        settings.MONGO_URI,
        serverSelectionTimeoutMS=3000,
        uuidRepresentation="standard",
        tz_aware=True,
    )


async def close() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


async def ping() -> None:
    """Verifica la conexión. Lanza una excepción si MongoDB no responde."""
    if _client is None:
        raise RuntimeError("MongoDB no inicializado")
    await _client.admin.command("ping")


def get_database() -> AsyncIOMotorDatabase:
    if _client is None:
        raise RuntimeError("MongoDB no inicializado")
    return _client[settings.MONGO_DB]
