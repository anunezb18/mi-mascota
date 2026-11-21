import { useEffect, useState } from "react";

import PetCard from "../components/PetCard.jsx";
import { useGeolocation } from "../hooks/useGeolocation.js";
import { searchPets } from "../services/petService.js";

export default function PetSearch() {
  const [species, setSpecies] = useState("");
  const [pets, setPets] = useState([]);
  const [error, setError] = useState(null);
  const { position, locate } = useGeolocation();

  useEffect(() => {
    searchPets({ species, lat: position?.lat, lng: position?.lng })
      .then(setPets)
      .catch((err) => setError(err.message));
  }, [species, position]);

  return (
    <section>
      <h1>Mascotas en adopción</h1>
      <div>
        <select value={species} onChange={(e) => setSpecies(e.target.value)}>
          <option value="">Todas</option>
          <option value="dog">Perros</option>
          <option value="cat">Gatos</option>
          <option value="other">Otras</option>
        </select>
        <button type="button" onClick={locate}>Cerca de mí</button>
        {/* TODO: selector de radio de búsqueda (radius_km) */}
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="pet-grid">
        {pets.map((pet) => <PetCard key={pet.id} pet={pet} />)}
      </div>
    </section>
  );
}
