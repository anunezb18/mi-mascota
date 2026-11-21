# 🗄️ database/

Scripts de inicialización de las tres bases de datos de MiMascota.

| Carpeta | Contenido | Cuándo se ejecuta |
|---|---|---|
| `postgres/init/` | `01-schema.sql`: tablas `users`, `foundations`, `adoption_requests` y `adoptions`, con llaves foráneas, restricciones `CHECK` y un índice único parcial. | Al crear el contenedor `postgres` por primera vez (volumen vacío). |
| `mongo/replica-set/` | `init-replica.sh`: inicia el replica set `rs0` (mongo1, mongo2, mongo3) y espera al primario. | Cada vez que arranca el servicio `mongo-setup`. |
| `mongo/init/` | `01-pets.js`: colección `pets` con validación `$jsonSchema` e índices (incluido `2dsphere`). | Lo ejecuta `init-replica.sh`. Es idempotente. |
| `redis/` | `redis.conf`: persistencia AOF y política de expulsión LRU. | Al arrancar el contenedor `redis`. |

## Notas

- **PostgreSQL**: si modificas `01-schema.sql` después del primer arranque, el cambio no se aplica solo. Usa una migración de Alembic o recrea el volumen con `docker compose down -v` (**esto borra los datos**).
- **Referencias entre bases**: `pets.foundation_id` (MongoDB) guarda el `id` de la fundación en PostgreSQL, y `adoption_requests.pet_id` (PostgreSQL) guarda el `ObjectId` de la mascota en MongoDB. Ninguna base puede validar la otra, así que la consistencia la mantiene la capa de servicios del backend.
- **Redis** no requiere esquema. Convenciones de claves:
  - `pets:search:<hash>`: resultados de búsqueda en caché (con TTL).
  - `notifications:user:<id>`: canal Pub/Sub de notificaciones por usuario.
