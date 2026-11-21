#!/usr/bin/env bash
# =====================================================================
#  Respaldo de PostgreSQL (pg_dump) y MongoDB (mongodump).
#  Uso (desde la raíz del repo, con los contenedores en ejecución):
#     ./scripts/backup.sh
#  En Windows ejecútalo desde Git Bash o WSL.
#  Resultado: backups/<fecha_hora>/postgres.dump y mongo.archive.gz
# =====================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT_DIR}"

if [ -f .env ]; then
  set -a; source .env; set +a
fi

POSTGRES_USER="${POSTGRES_USER:-mimascota}"
POSTGRES_DB="${POSTGRES_DB:-mimascota}"
MONGO_DB="${MONGO_DB:-mimascota}"
RS_NAME="${MONGO_REPLICA_SET_NAME:-rs0}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
TARGET="${BACKUP_DIR}/${TIMESTAMP}"
mkdir -p "${TARGET}"

echo ">> Respaldando PostgreSQL (${POSTGRES_DB})..."
docker compose exec -T postgres \
  pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --format=custom \
  > "${TARGET}/postgres.dump"

echo ">> Respaldando MongoDB (${MONGO_DB})..."
docker compose exec -T mongo1 \
  mongodump --uri "mongodb://mongo1:27017,mongo2:27017,mongo3:27017/?replicaSet=${RS_NAME}" \
  --db "${MONGO_DB}" --archive --gzip \
  > "${TARGET}/mongo.archive.gz"

echo ">> Respaldo completo en ${TARGET}"
ls -lh "${TARGET}"

# TODO: definir política de retención (p. ej. borrar respaldos con más de N días)
