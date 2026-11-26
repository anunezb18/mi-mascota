# MiMascota · Backend

API REST y canal de notificaciones en tiempo real de MiMascota, con **FastAPI** y **MongoDB** (driver asíncrono oficial `AsyncMongoClient` de PyMongo).

- El contrato completo de los endpoints está en el [README del frontend](../frontend/README.md#contrato-de-la-api).
- El diseño de la base de datos está en [database/README.md](../database/README.md).
- La documentación interactiva se genera en http://localhost:8000/docs.

## Estructura

```
backend/
├── app/
│   ├── main.py                 App, CORS, manejadores de error y ciclo de vida (conexión + change stream)
│   ├── core/                   Configuración (.env), seguridad (bcrypt, JWT) y errores en español
│   ├── db/mongo.py             Cliente de MongoDB, colecciones y bucket GridFS
│   ├── api/
│   │   ├── router.py           Agrupa los módulos bajo /api
│   │   └── dependencies/       Usuario actual, roles y fundación aprobada
│   ├── modules/                Un módulo por recurso: router.py, schemas.py (Pydantic) y service.py
│   │   ├── auth/               Login, registro (transacción usuario + fundación) y /me
│   │   ├── usuarios/           Cuenta, contraseña y perfil de estilo de vida
│   │   ├── fundaciones/        Panel de la fundación y validación de NIT
│   │   ├── mascotas/           Catálogo ($geoNear), gestión, historial médico y fotos (GridFS)
│   │   ├── solicitudes/        Envío y resolución transaccional
│   │   ├── recomendaciones/    Algoritmo de compatibilidad
│   │   ├── notificaciones/     Historial, contador y marcado de leídas
│   │   └── admin/              Validación de fundaciones y estado de usuarios
│   ├── realtime/               WebSocket /ws/notificaciones y change stream
│   └── shared/                 Serialización BSON/JSON, tipos y búsqueda sin tildes
├── tests/integration/          Pruebas de los flujos completos contra la API en ejecución
├── requirements.txt
├── requirements-dev.txt
└── Dockerfile
```

## Ejecución

### Con Docker (recomendada)

Desde la raíz del repositorio:

```bash
docker compose up -d --build
```

El backend arranca cuando `mongo-setup` termina de preparar la base y queda en http://localhost:8000. El código se monta como volumen y uvicorn se recarga al guardar cambios.

### En local

Las bases de datos siguen en Docker y el backend corre en un entorno virtual:

```bash
docker compose up -d mongo1 mongo2 mongo3 mongo-setup

cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows
# source .venv/bin/activate       # Linux / macOS
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

El backend lee el `.env` de la raíz del repositorio. Desde el equipo anfitrión se conecta con `MONGO_URI=mongodb://localhost:27017/?directConnection=true` al nodo `mongo1`, que tiene la mayor prioridad y normalmente es el primario. Las transacciones y los change streams funcionan igual.

## Pruebas

Con la API en ejecución (Docker o local):

```bash
pip install -r requirements-dev.txt
pytest -v
```

`tests/integration/test_flujos.py` recorre los flujos principales con cuentas creadas en cada ejecución:

- Inicio de sesión: credenciales inválidas, cuenta inactiva.
- Catálogo: filtros, búsqueda sin tildes y `$geoNear`.
- Registro y validación de fundaciones.
- Publicación de mascotas, historial médico y subida de fotos a GridFS.
- Recomendaciones.
- Recepción de la solicitud por WebSocket.
- Aprobación transaccional con rechazo automático y rechazo que devuelve la mascota a disponible.
- Actualización de la cuenta, notificaciones y desactivación de usuarios.

Los registros que crean las pruebas quedan en la base. `docker compose down -v` la reinicia con los datos de prueba originales.

## Decisiones técnicas

| Tema | Decisión |
|---|---|
| Driver | `pymongo.AsyncMongoClient`, el driver asíncrono oficial; reemplaza a Motor |
| Respuestas | Documentos de MongoDB convertidos a JSON (`ObjectId` → cadena, fechas → ISO 8601 UTC) |
| Validación | Pydantic en la entrada (`extra="forbid"`) y `$jsonSchema` en la base como segunda barrera |
| Errores | `{ "detail": "mensaje en español" }`. Clave duplicada → 409, documento rechazado por el esquema → 422 |
| Autenticación | JWT HS256 con `sub` (id) y `rol`. Una cuenta desactivada recibe 401 aunque su token no haya vencido |
| Contraseñas | bcrypt; nunca se devuelven ni se registran |
| Escrituras compuestas | Transacciones con `session.with_transaction`, que reintenta ante errores transitorios |
| Tiempo real | Change stream sobre `notificaciones` → WebSocket. Se reanuda con `resume_after` tras un corte |
| CORS | Orígenes de `CORS_ORIGINS` y cualquier puerto de `localhost` en desarrollo |
