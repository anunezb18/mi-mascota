import { Navigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.jsx";

// Redirige a /login si no hay sesión. TODO: aceptar una lista de roles permitidos.
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
