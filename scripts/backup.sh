#!/usr/bin/env bash
# =====================================================================
#  Respaldo de MongoDB (mongodump): colecciones, índices, validadores
#  y fotos guardadas en GridFS.
#  Uso (desde la raíz del repo, con los contenedores en ejecución):
#     ./scripts/backup.sh
#  En Windows ejecútelo desde Git Bash o WSL.
#  Resultado: backups/<fecha_hora>/mongo.archive.gz
# =====================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT_DIR}"

if [ -f .env ]; then
  set -a; source .env; set +a
fi

MONGO_DB="${MONGO_DB:-mimascota}"
RS_NAME="${MONGO_REPLICA_SET_NAME:-rs0}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
TARGET="${BACKUP_DIR}/${TIMESTAMP}"
mkdir -p "${TARGET}"

echo ">> Respaldando MongoDB (${MONGO_DB})..."
docker compose exec -T mongo1 \
  mongodump --uri "mongodb://mongo1:27017,mongo2:27017,mongo3:27017/?replicaSet=${RS_NAME}" \
  --db "${MONGO_DB}" --archive --gzip \
  > "${TARGET}/mongo.archive.gz"

echo ">> Respaldo completo en ${TARGET}"
ls -lh "${TARGET}"
