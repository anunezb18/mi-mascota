// =====================================================================
//  Colección "pets": perfiles de mascotas.
//  - Validación con $jsonSchema (campos comunes obligatorios).
//  - "attributes" es un objeto libre: su estructura varía por especie.
//  - "medical_history" es un arreglo de documentos anidados.
//  - "location" es un GeoJSON Point con índice 2dsphere.
//  Script idempotente: crea la colección o actualiza su validador.
// =====================================================================

const petSchema = {
  bsonType: "object",
  required: ["name", "species", "foundation_id", "status", "location", "created_at"],
  properties: {
    name: { bsonType: "string", minLength: 1, maxLength: 100 },
    species: { enum: ["dog", "cat", "other"] },
    breed: { bsonType: ["string", "null"] },
    sex: { enum: ["male", "female", "unknown"] },
    age_months: { bsonType: ["int", "long"], minimum: 0 },
    description: { bsonType: ["string", "null"], maxLength: 2000 },
    // Referencia al id de la fundación en PostgreSQL (foundations.id)
    foundation_id: { bsonType: ["int", "long"] },
    status: { enum: ["available", "in_process", "adopted"] },
    // Atributos propios de cada especie (estructura variable)
    attributes: { bsonType: "object" },
    medical_history: {
      bsonType: "array",
      items: {
        bsonType: "object",
        required: ["date", "type", "description"],
        properties: {
          date: { bsonType: "date" },
          type: { bsonType: "string" }, // vacuna, desparasitación, cirugía...
          description: { bsonType: "string" },
          veterinarian: { bsonType: ["string", "null"] }
        }
      }
    },
    location: {
      bsonType: "object",
      required: ["type", "coordinates"],
      properties: {
        type: { enum: ["Point"] },
        // [longitud, latitud]
        coordinates: {
          bsonType: "array",
          minItems: 2,
          maxItems: 2,
          items: { bsonType: ["double", "int"] }
        }
      }
    },
    photos: { bsonType: "array", items: { bsonType: "string" } },
    created_at: { bsonType: "date" },
    updated_at: { bsonType: "date" }
  }
};

const options = {
  validator: { $jsonSchema: petSchema },
  validationLevel: "strict",
  validationAction: "error"
};

if (db.getCollectionNames().includes("pets")) {
  db.runCommand({ collMod: "pets", ...options });
  print("Validador de 'pets' actualizado.");
} else {
  db.createCollection("pets", options);
  print("Colección 'pets' creada.");
}

// Índices
db.pets.createIndex({ location: "2dsphere" }, { name: "location_2dsphere" });
db.pets.createIndex({ species: 1, status: 1 }, { name: "species_status" });
db.pets.createIndex({ foundation_id: 1 }, { name: "foundation_id" });
print("Índices de 'pets' verificados.");
