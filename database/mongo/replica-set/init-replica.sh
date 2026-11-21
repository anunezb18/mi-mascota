#!/usr/bin/env bash
# =====================================================================
#  Inicializa el replica set de MongoDB y ejecuta los scripts de
#  database/mongo/init/*.js. Lo ejecuta el servicio "mongo-setup".
#  Es idempotente: si el replica set ya existe, solo reaplica los scripts.
# =====================================================================
set -euo pipefail

RS_NAME="${MONGO_REPLICA_SET_NAME:-rs0}"
DB_NAME="${MONGO_DB:-mimascota}"
MAX_RETRIES=30

echo ">> Verificando replica set ${RS_NAME}..."
mongosh --host mongo1:27017 --quiet --eval "
try {
  rs.status();
  print('El replica set ya estaba iniciado.');
} catch (e) {
  rs.initiate({
    _id: '${RS_NAME}',
    members: [
      { _id: 0, host: 'mongo1:27017', priority: 2 },
      { _id: 1, host: 'mongo2:27017', priority: 1 },
      { _id: 2, host: 'mongo3:27017', priority: 1 }
    ]
  });
  print('Replica set iniciado.');
}
"

echo ">> Esperando a que mongo1 sea PRIMARY..."
for i in $(seq 1 "${MAX_RETRIES}"); do
  if mongosh --host mongo1:27017 --quiet --eval "db.hello().isWritablePrimary" | grep -q true; then
    echo "   mongo1 es PRIMARY."
    break
  fi
  if [ "${i}" -eq "${MAX_RETRIES}" ]; then
    echo "   ERROR: no se eligió un primario a tiempo." >&2
    exit 1
  fi
  sleep 2
done

URI="mongodb://mongo1:27017,mongo2:27017,mongo3:27017/${DB_NAME}?replicaSet=${RS_NAME}"
for script in /scripts/init/*.js; do
  echo ">> Ejecutando ${script}"
  mongosh "${URI}" --quiet --file "${script}"
done

echo ">> MongoDB listo."
