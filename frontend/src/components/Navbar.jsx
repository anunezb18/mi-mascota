import { Link } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.jsx";

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="brand">🐾 MiMascota</Link>
      <Link to="/mascotas">Mascotas</Link>
      {isAuthenticated ? (
        <>
          <Link to="/solicitudes">Mis solicitudes</Link>
          <button type="button" onClick={logout}>Salir</button>
        </>
      ) : (
        <>
          <Link to="/login">Ingresar</Link>
          <Link to="/registro">Registrarse</Link>
        </>
      )}
    </nav>
  );
}
