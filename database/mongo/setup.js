// =====================================================================
//  MiMascota - Preparación de la base de datos (mongosh)
//  Lo ejecuta el servicio mongo-setup cada vez que se levanta el entorno.
//  Es idempotente:
//    1. Crea cada colección con su validador $jsonSchema, o actualiza el
//       validador si la colección ya existe (collMod).
//    2. Crea los índices (createIndex no duplica los existentes).
//    3. Carga los datos de demostración SOLO si la base está vacía
//       (primer arranque). En los siguientes arranques los datos se conservan.
// =====================================================================
const fs = require("fs");

const BASE = "/scripts";
const COLECCIONES = ["usuarios", "fundaciones", "mascotas", "solicitudes", "notificaciones"];

const leerJson = (ruta) => JSON.parse(fs.readFileSync(`${BASE}/${ruta}`, "utf8"));

// Fragmentos compartidos entre validadores: { "$incluir": "geoPunto" } se reemplaza por su definición
const comunes = leerJson("validators/_comunes.json");
function resolverInclusiones(nodo) {
  if (Array.isArray(nodo)) return nodo.map(resolverInclusiones);
  if (nodo && typeof nodo === "object") {
    if (typeof nodo.$incluir === "string") {
      if (!comunes[nodo.$incluir]) throw new Error(`Fragmento desconocido: ${nodo.$incluir}`);
      return resolverInclusiones(comunes[nodo.$incluir]);
    }
    return Object.fromEntries(Object.entries(nodo).map(([k, v]) => [k, resolverInclusiones(v)]));
  }
  return nodo;
}

/** Suma `desfase` milisegundos a todas las fechas de un documento (recursivo). */
function desplazarFechas(nodo, desfase) {
  if (Object.prototype.toString.call(nodo) === "[object Date]") return new Date(nodo.getTime() + desfase);
  if (Array.isArray(nodo)) return nodo.map((v) => desplazarFechas(v, desfase));
  if (nodo && typeof nodo === "object" && !nodo._bsontype) {
    for (const k of Object.keys(nodo)) nodo[k] = desplazarFechas(nodo[k], desfase);
  }
  return nodo;
}

print(`\n== MiMascota: preparando la base "${db.getName()}" ==`);

/* 1. Colecciones y validadores ------------------------------------------------ */
const existentes = db.getCollectionNames();
for (const nombre of COLECCIONES) {
  const opciones = {
    validator: resolverInclusiones(leerJson(`validators/${nombre}.json`)),
    validationLevel: "strict",
    validationAction: "error",
  };
  if (existentes.includes(nombre)) {
    db.runCommand({ collMod: nombre, ...opciones });
    print(`  [colección] ${nombre}: ya existía, validador actualizado`);
  } else {
    db.createCollection(nombre, opciones);
    print(`  [colección] ${nombre}: creada`);
  }
}

/* 2. Índices ----------------------------------------------------------------- */
const indices = leerJson("indexes/indices.json");
for (const [coleccion, lista] of Object.entries(indices)) {
  for (const { clave, opciones } of lista) {
    db.getCollection(coleccion).createIndex(clave, opciones);
  }
  print(`  [índices] ${coleccion}: ${lista.map((i) => i.opciones.name).join(", ")}`);
}

/* 3. Datos de demostración (solo en el primer arranque) ----------------------- */
if (db.usuarios.countDocuments({}) > 0) {
  print("  [datos] la base ya tiene datos: se conservan sin cambios");
} else {
  const datos = EJSON.parse(fs.readFileSync(`${BASE}/seed/datos.json`, "utf8"), { relaxed: true });

  // Las fechas de la semilla son relativas al momento en que se generó;
  // se desplazan para que sean relativas al primer arranque ("hace 3 días").
  const desfase = Date.now() - datos.referencia.getTime();

  for (const nombre of COLECCIONES) {
    const documentos = desplazarFechas(datos[nombre], desfase);
    db.getCollection(nombre).insertMany(documentos);
    print(`  [datos] ${nombre}: ${documentos.length} documentos`);
  }
}

print("== Base de datos lista ==\n");
