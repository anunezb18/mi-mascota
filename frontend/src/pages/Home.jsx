import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section>
      <h1>🐾 MiMascota</h1>
      <p>Conectamos fundaciones con personas que quieren adoptar.</p>
      <Link to="/mascotas">Buscar mascotas</Link>
    </section>
  );
}
