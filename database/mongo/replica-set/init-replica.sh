#!/usr/bin/env bash
# =====================================================================
#  MiMascota - Inicio del replica set y preparación de la base
#  Lo ejecuta el servicio mongo-setup de docker-compose en cada arranque.
#  - Primer arranque: inicia el replica set rs0 (mongo1, mongo2, mongo3),
#    crea colecciones, validadores e índices y carga los datos de prueba.
#  - Arranques siguientes: detecta que todo existe y conserva los datos.
# =====================================================================
set -euo pipefail

RS="${MONGO_REPLICA_SET_NAME:-rs0}"
DB="${MONGO_DB:-mimascota}"

esperar() {
  local descripcion="$1" comando="$2" intentos=0
  echo ">> Esperando ${descripcion}..."
  until mongosh --host mongo1 --quiet --eval "${comando}" 2>/dev/null | grep -q "^true$"; do
    intentos=$((intentos + 1))
    if [ "${intentos}" -ge 60 ]; then
      echo "!! Tiempo agotado esperando ${descripcion}" >&2
      exit 1
    fi
    sleep 2
  done
}

esperar "a mongo1" "db.adminCommand('ping').ok === 1"

ya_iniciado=$(mongosh --host mongo1 --quiet --eval "try { rs.status().ok === 1 } catch (e) { false }")
if [ "${ya_iniciado}" = "true" ]; then
  echo ">> El replica set ${RS} ya estaba iniciado"
else
  echo ">> Iniciando el replica set ${RS}"
  mongosh --host mongo1 --quiet --eval "
    rs.initiate({
      _id: '${RS}',
      members: [
        { _id: 0, host: 'mongo1:27017', priority: 2 },
        { _id: 1, host: 'mongo2:27017', priority: 1 },
        { _id: 2, host: 'mongo3:27017', priority: 1 }
      ]
    })"
fi

esperar "un nodo primario" "Boolean(db.hello().primary)"

URI="mongodb://mongo1:27017,mongo2:27017,mongo3:27017/${DB}?replicaSet=${RS}"
mongosh "${URI}" --quiet --file /scripts/setup.js
