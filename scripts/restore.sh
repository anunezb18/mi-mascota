#!/usr/bin/env bash
# =====================================================================
#  Restaura un respaldo creado con scripts/backup.sh.
#  Uso:
#     ./scripts/restore.sh backups/20260101_120000
#  ATENCIÓN: reemplaza los datos actuales de PostgreSQL y MongoDB.
# =====================================================================
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Uso: $0 <carpeta_de_respaldo>" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$(cd "$1" && pwd)"
cd "${ROOT_DIR}"

if [ -f .env ]; then
  set -a; source .env; set +a
fi

POSTGRES_USER="${POSTGRES_USER:-mimascota}"
POSTGRES_DB="${POSTGRES_DB:-mimascota}"
MONGO_DB="${MONGO_DB:-mimascota}"
RS_NAME="${MONGO_REPLICA_SET_NAME:-rs0}"

for f in postgres.dump mongo.archive.gz; do
  if [ ! -f "${SOURCE}/${f}" ]; then
    echo "No se encontró ${SOURCE}/${f}" >&2
    exit 1
  fi
done

read -r -p "Esto sobrescribirá los datos actuales. ¿Continuar? [s/N] " answer
if [ "${answer}" != "s" ] && [ "${answer}" != "S" ]; then
  echo "Cancelado."
  exit 0
fi

echo ">> Restaurando PostgreSQL..."
docker compose exec -T postgres \
  pg_restore -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --clean --if-exists --no-owner \
  < "${SOURCE}/postgres.dump"

echo ">> Restaurando MongoDB..."
docker compose exec -T mongo1 \
  mongorestore --uri "mongodb://mongo1:27017,mongo2:27017,mongo3:27017/?replicaSet=${RS_NAME}" \
  --nsInclude "${MONGO_DB}.*" --archive --gzip --drop \
  < "${SOURCE}/mongo.archive.gz"

echo ">> Restauración completa."
