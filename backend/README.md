# backend/

API REST de MiMascota con **FastAPI** (Python 3.12). Se conecta a PostgreSQL, MongoDB y Redis.

## Arquitectura por capas

```
app/
├── main.py           # Crea la app, CORS, routers y lifespan (abre/cierra conexiones)
├── core/             # config.py (pydantic-settings), security.py (JWT + bcrypt), roles.py
├── api/
│   ├── router.py     # Router /api/v1
│   └── routes/       # Endpoints: health, auth, users, foundations, pets, adoption_requests
├── schemas/          # Modelos Pydantic v2 (entrada/salida)
├── services/         # Lógica de negocio
├── db/
│   ├── mongo/        # Cliente Motor y colecciones
│   └── postgres/     # Engine/sesiones async y modelos SQLAlchemy
├── cache/            # Cliente Redis, caché de búsquedas y Pub/Sub
└── dependencies/     # Depends(): sesión de BD, usuario actual, control de roles
```

Flujo de una petición: **route → service → db / cache**. Las rutas no acceden a las bases directamente.

## Ejecutar en local (sin Docker para el backend)

Requiere que las bases estén levantadas: `docker compose up -d postgres mongo1 mongo2 mongo3 mongo-setup redis` desde la raíz.

```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

La configuración se lee del `.env` de la raíz del repositorio (o de `backend/.env`).

- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs · ReDoc: http://localhost:8000/redoc
- Estado de las bases: http://localhost:8000/health

## Pruebas

```bash
pytest
```

Las pruebas actuales no necesitan las bases de datos: simulan las conexiones.

## Migraciones (Alembic)

`database/postgres/init/01-schema.sql` crea el esquema inicial. Para los cambios posteriores:

```bash
alembic revision --autogenerate -m "descripcion del cambio"
alembic upgrade head
```

> Antes de la primera migración, crea una revisión base vacía y márcala como aplicada con `alembic stamp head`, para que Alembic no intente recrear las tablas que ya existen. Revisa siempre el archivo generado antes de aplicarlo.

## Estado

Las conexiones, `/health`, JWT, el control de roles y la caché/Pub/Sub de Redis funcionan. Los demás endpoints responden `501 Not Implemented` y tienen comentarios `TODO` con lo que falta.
