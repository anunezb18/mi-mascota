import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getPet } from "../services/petService.js";

// TODO: mostrar fotos, atributos por especie, historial médico y el botón
// "Solicitar adopción" (adoptionService.createAdoptionRequest).
export default function PetDetail() {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPet(id).then(setPet).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p role="alert">{error}</p>;
  if (!pet) return <p>Cargando...</p>;

  return (
    <section>
      <h1>{pet.name}</h1>
      <p>{pet.description}</p>
    </section>
  );
}
