import { Link } from "react-router-dom";

export default function PetCard({ pet }) {
  return (
    <article className="pet-card">
      {/* TODO: mostrar la primera foto (pet.photos[0]) */}
      <h3>{pet.name}</h3>
      <p>{pet.species} · {pet.breed ?? "Sin raza definida"}</p>
      {pet.distance_km != null && <p>A {pet.distance_km.toFixed(1)} km</p>}
      <Link to={`/mascotas/${pet.id}`}>Ver perfil</Link>
    </article>
  );
}
