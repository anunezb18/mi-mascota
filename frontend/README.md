# 🎨 frontend/

Interfaz web de MiMascota con **React 18 + Vite**.

## Estructura

```
src/
├── main.jsx        # Punto de entrada: Router + AuthProvider
├── App.jsx         # Definición de rutas
├── pages/          # Vistas: Home, Login, Register, PetSearch, PetDetail, MyRequests, NotFound
├── components/     # Piezas reutilizables: Navbar, PetCard, ProtectedRoute
├── services/       # Llamadas a la API (api.js añade el JWT automáticamente)
└── hooks/          # useAuth (sesión) y useGeolocation (búsqueda por cercanía)
```

## Ejecutar en local

```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173. La URL del backend se define con `VITE_API_URL` (por defecto `http://localhost:8000/api/v1`).

## Estado

El enrutamiento, el cliente HTTP, el login y la búsqueda de mascotas ya tienen su estructura. Las vistas marcadas con `TODO` están pendientes.
