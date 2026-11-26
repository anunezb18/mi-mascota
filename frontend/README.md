# MiMascota · Frontend

Interfaz web de MiMascota, la plataforma de adopción de mascotas que conecta fundaciones de Bogotá con personas que quieren adoptar. Proyecto final de **Bases de Datos NoSQL**, Ingeniería de Sistemas, Universidad Distrital Francisco José de Caldas.

El frontend funciona de dos maneras:

- **Modo mock** (`VITE_USE_MOCK=true`): no necesita backend. Una base de datos simulada en el navegador replica las colecciones de MongoDB, las reglas de negocio y las notificaciones en tiempo real.
- **Modo API** (`VITE_USE_MOCK=false`): consume el backend FastAPI y el WebSocket de notificaciones descritos en el [contrato de la API](#contrato-de-la-api).

## Contenido

1. [Tecnologías](#tecnologías)
2. [Ejecución](#ejecución)
3. [Modo mock](#modo-mock)
4. [Pantallas](#pantallas)
5. [Estructura del proyecto](#estructura-del-proyecto)
6. [Contrato de la API](#contrato-de-la-api)
7. [Notificaciones en tiempo real (WebSocket)](#notificaciones-en-tiempo-real-websocket)
8. [Reglas de negocio](#reglas-de-negocio)
9. [Algoritmo de compatibilidad](#algoritmo-de-compatibilidad)
10. [Diseño y accesibilidad](#diseño-y-accesibilidad)

## Tecnologías

| Área | Herramienta |
|---|---|
| Base | React 18, Vite 5, TypeScript 5 (modo estricto) |
| Rutas | React Router 6 (data router, carga diferida por pantalla, rutas protegidas por rol) |
| Datos del servidor | TanStack Query 5 sobre una capa de servicios por recurso |
| HTTP | Axios con cliente central: adjunta el JWT y gestiona el 401 |
| Formularios | React Hook Form + Zod |
| Interfaz | Tailwind CSS 3 con sistema de diseño propio, componentes estilo shadcn/ui sobre Radix UI |
| Mapas | Leaflet + react-leaflet (OpenStreetMap) |
| Íconos y avisos | Lucide, Sonner |

## Ejecución

Requisitos: Node.js 20 o superior y npm.

```bash
cd frontend
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm run dev
```

Abra http://localhost:5173. El archivo `.env.example` trae `VITE_USE_MOCK=true`, así que la aplicación funciona sin backend.

| Script | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo en el puerto 5173 |
| `npm run build` | Verificación de tipos y compilación de producción en `dist/` |
| `npm run preview` | Sirve la compilación de producción |
| `npm run typecheck` | Solo verificación de tipos |

### Variables de entorno

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000/api` | URL base de la API REST |
| `VITE_WS_URL` | `ws://localhost:8000/ws/notificaciones` | WebSocket de notificaciones |
| `VITE_USE_MOCK` | `true` en `.env.example` | `true`: datos simulados; `false`: API real |
| `VITE_USE_POLLING` | no definida | `true` activa la detección de cambios por sondeo (Docker en Windows o macOS) |

### Con Docker Compose

Desde la raíz del repositorio, `docker compose up frontend` levanta el servicio en el puerto 5173. En `docker-compose.yml` el modo mock está desactivado por defecto (`VITE_USE_MOCK:-false`); para usarlo sin backend defina `VITE_USE_MOCK=true` en el `.env` de la raíz.

## Modo mock

### Cuentas de demostración

Todas usan la contraseña **`MiMascota2026`**. En modo mock la pantalla de ingreso muestra botones para entrar con un clic.

| Rol | Correo | Situación |
|---|---|---|
| Adoptante | `adoptante@mimascota.co` | Perfil de estilo de vida completo y tres solicitudes (pendiente, aprobada y rechazada) |
| Fundación | `fundacion@mimascota.co` | Fundación Huellas de Suba, aprobada, con solicitudes pendientes |
| Administrador | `admin@mimascota.co` | Fundaciones pendientes por validar |
| Fundación pendiente | `hola@bigotesteusaquillo.org` | Ve el aviso de validación pendiente; no puede publicar |
| Fundación rechazada | `refugiodelsur@correo.co` | Ve el motivo del rechazo |
| Adoptante inactivo | `mariana.lozano@correo.co` | Cuenta desactivada: el ingreso responde 403 |

### Datos simulados

- 7 fundaciones en localidades reales de Bogotá, con coordenadas reales; 24 mascotas (perros, gatos y conejos); 10 solicitudes; y un historial de notificaciones coherente con esos datos.
- Los cambios se guardan en `localStorage` con la clave `mimascota.mockdb.v4` y sobreviven a las recargas. Para volver al estado inicial, borre esa clave desde las herramientas del navegador (Aplicación > Almacenamiento local) y recargue.
- La latencia de red se simula entre 250 y 900 ms para que se vean los estados de carga.
- Las fotos que sube una fundación se comprimen en el navegador y se guardan dentro de los datos simulados. El almacenamiento local admite unos 5 MB; si se llena, la aplicación sigue funcionando, pero esas fotos se pierden al recargar.

### Tiempo real en modo mock

En un navegador solo hay una sesión a la vez, así que el mock simula la actividad de otros usuarios. Unos 15 segundos después de iniciar sesión, una vez por sesión:

- **Fundación aprobada**: un adoptante de la semilla envía una solicitud para una de sus mascotas.
- **Administrador**: una fundación nueva se registra y queda pendiente de validación.

Los datos se escriben igual que con una acción real. La campana suena, el contador aumenta, aparece un aviso y se actualizan el panel, la bandeja o la lista de fundaciones.

Para probar el resto del flujo, haga la acción con una cuenta y luego ingrese con la otra. Por ejemplo, envíe una solicitud como adoptante; al ingresar como la fundación encontrará la notificación sin leer.

## Pantallas

| # | Pantalla | Ruta | Acceso |
|---|---|---|---|
| 1 | Inicio | `/` | Público |
| 2 | Ingreso y registro (con selección de rol) | `/ingresar`, `/registro`, `/registro?rol=fundacion` | Sin sesión |
| 3 | Catálogo con filtros, búsqueda por cercanía y vista de lista o mapa | `/mascotas` | Público |
| 4 | Detalle de la mascota | `/mascotas/:id` | Público (solicitar: adoptante) |
| 5 | Asistente del perfil de estilo de vida | `/adoptante/perfil-estilo-vida` | Adoptante |
| 6 | Recomendaciones con porcentaje y razones | `/adoptante/recomendaciones` | Adoptante |
| 7 | Mis solicitudes con estado e historial | `/adoptante/solicitudes` | Adoptante |
| 8 | Panel de la fundación | `/fundacion` | Fundación |
| 9 | Gestión de mascotas y formulario por especie | `/fundacion/mascotas`, `/fundacion/mascotas/nueva`, `/fundacion/mascotas/:id/editar` | Fundación |
| 10 | Bandeja de solicitudes | `/fundacion/solicitudes` | Fundación |
| 11 | Validación de fundaciones | `/admin/fundaciones` | Administrador |
| 12 | Gestión de usuarios | `/admin/usuarios` | Administrador |
| 13 | Notificaciones: campana con contador en tiempo real e historial | Barra superior, `/notificaciones` | Con sesión |
| 14 | Mi cuenta | `/cuenta` | Con sesión |
| 15 | Página no encontrada y acceso denegado | Cualquier ruta inexistente, `/acceso-denegado` | Público |

Comportamiento de navegación:

- Sin sesión, una ruta protegida redirige al ingreso y, después de iniciar sesión, vuelve a la ruta pedida. Con un rol no permitido, la ruta redirige a "acceso denegado".
- Después de iniciar sesión, cada rol llega a su inicio: el adoptante a recomendaciones, la fundación a su panel y el administrador a la validación de fundaciones.
- La fundación y el administrador trabajan en un panel con barra lateral, que también da acceso a la cuenta y al sitio público. Desde el sitio público vuelven al panel con el botón "Ir a mi panel". Notificaciones y Mi cuenta se muestran dentro del panel para estos roles y dentro del sitio para el adoptante.

## Estructura del proyecto

```
src/
├── components/
│   ├── layout/        Navbar, barra lateral, layouts por rol, pie de página, límites de error
│   └── ui/            Componentes base del sistema de diseño (botón, diálogo, tabla, insignias...)
├── features/          Un módulo por dominio: services/ (API y mock), hooks.ts (TanStack Query),
│   ├── auth/          components/, pages/ y schemas.ts (Zod)
│   ├── mascotas/
│   ├── solicitudes/
│   ├── recomendaciones/
│   ├── notificaciones/
│   ├── fundacion/
│   └── admin/
├── hooks/             Hooks genéricos (geolocalización, debounce, título del documento...)
├── lib/               Cliente HTTP, entorno, claves de caché, etiquetas, formatos, localidades de Bogotá
├── mocks/             Base simulada, semillas, servicios mock, simulador de actividad
├── routes/            Router, guardas por rol, rutas y páginas generales
└── types/             Tipos que reflejan los documentos de MongoDB
```

Convenciones:

- **Tipos espejo de MongoDB**: `src/types` describe cada colección tal como la serializa la API. Los `ObjectId` llegan como cadenas hexadecimales de 24 caracteres y las fechas como ISO 8601.
- **Servicios intercambiables**: cada recurso define una interfaz y dos implementaciones, `xApi` y `xMock`. Se exporta `xService = env.useMock ? xMock : xApi`, de modo que las pantallas no saben cuál se usa.
- **Caché**: las claves de TanStack Query están centralizadas en `src/lib/query-keys.ts`. Cada mutación invalida exactamente los datos que afecta.
- **Cliente HTTP** (`src/lib/api-client.ts`): adjunta `Authorization: Bearer <token>`. Ante un 401 cierra la sesión y avisa. Convierte el `detail` de FastAPI en mensajes legibles en español.

## Contrato de la API

Esta es la lista completa de endpoints que el frontend consume. Las formas de cada respuesta están en `src/types`, y los servicios mock en `src/mocks/services` sirven de implementación de referencia del comportamiento esperado.

### Convenciones generales

- Prefijo: `VITE_API_URL` (por defecto `http://localhost:8000/api`).
- Autenticación: `Authorization: Bearer <JWT>` en todas las rutas excepto login, registro y la consulta pública de mascotas.
- Errores: cuerpo de FastAPI `{ "detail": "mensaje" }` o la lista de validación de Pydantic. El frontend muestra el `detail` al usuario, así que debe estar en español.

| Código | Uso esperado |
|---|---|
| 400 | Datos incorrectos (p. ej. contraseña actual errónea) |
| 401 | Token ausente, inválido o de una cuenta desactivada. El frontend cierra la sesión. |
| 403 | Rol no permitido, recurso de otra fundación, fundación no aprobada o cuenta desactivada al iniciar sesión |
| 404 | Recurso inexistente |
| 409 | Conflicto de estado (correo duplicado, solicitud ya resuelta, mascota adoptada...) |
| 422 | Validación o requisito previo incumplido (p. ej. adoptante sin perfil de estilo de vida) |

- Los parámetros de consulta con varios valores se envían repetidos: `?temperamento=sociable&temperamento=jugueton`.
- Las coordenadas son GeoJSON `{ "type": "Point", "coordinates": [longitud, latitud] }`, el formato del índice `2dsphere`.
- Los listados se devuelven como arreglos JSON sin envoltura.

### Autenticación

| Método | Ruta | Rol | Cuerpo / parámetros | Respuesta |
|---|---|---|---|---|
| POST | `/auth/login` | Público | `LoginPayload { correo, contrasena }` | `AuthResponse` |
| POST | `/auth/registro` | Público | `RegistroPayload` (adoptante o fundación, ver abajo) | `AuthResponse` |
| GET | `/auth/me` | Con sesión | | `Usuario` |

- `AuthResponse = { access_token, token_type: "bearer", usuario: Usuario }`.
- Login: 401 si las credenciales no coinciden; 403 si la cuenta está desactivada.
- Registro de adoptante: `{ rol: "adoptante", nombre, correo, contrasena, telefono?, ciudad? }`.
- Registro de fundación: `{ rol: "fundacion", nombre, correo, contrasena, telefono, fundacion: { nombre, nit, descripcion, direccion, ciudad, localidad?, sitio_web? } }`. Crea el usuario y el documento de la fundación con `estado_validacion: "pendiente"`, enlazados por `usuario.fundacion_id` y `fundacion.usuario_id`, y notifica a cada administrador (`fundacion_pendiente`). Responde 409 si el correo ya existe.

### Cuenta del usuario

| Método | Ruta | Rol | Cuerpo | Respuesta |
|---|---|---|---|---|
| PATCH | `/usuarios/me` | Con sesión | `{ nombre?, telefono?, ciudad? }` | `Usuario` |
| PUT | `/usuarios/me/contrasena` | Con sesión | `{ contrasena_actual, contrasena_nueva }` | 204 sin cuerpo |
| PUT | `/usuarios/me/perfil-estilo-vida` | Adoptante | `PerfilEstiloVida` sin `actualizado_en` | `Usuario` |

- `PATCH /usuarios/me`: una cadena vacía en `telefono` o `ciudad` elimina el dato. El correo no se puede cambiar. Si el usuario es adoptante, se actualizan también las copias de sus datos en `solicitudes.adoptante`.
- Cambio de contraseña: 400 si la actual no coincide o si la nueva es igual a la actual.
- El perfil de estilo de vida es un subdocumento embebido en el usuario. El servidor asigna `actualizado_en`, y si `tiene_otras_mascotas` es falso guarda `otras_mascotas: []`.

### Mascotas (catálogo público)

| Método | Ruta | Rol | Parámetros | Respuesta |
|---|---|---|---|---|
| GET | `/mascotas` | Público | `especie, tamano, etapa, temperamento[], lat, lng, radio_km, estado, q, limite` | `Mascota[]` |
| GET | `/mascotas/{id}` | Público | | `Mascota` (404 si no existe) |

- Sin `estado`, el catálogo **excluye las adoptadas**.
- `etapa` filtra por rango de `edad_meses`: cachorro de 0 a 11, joven de 12 a 35, adulto de 36 a 95, senior de 96 en adelante.
- `temperamento` exige **todos** los valores enviados (`$all`).
- `q` busca en nombre o raza.
- Con `lat` y `lng` se usa `$geoNear` sobre `ubicacion` con radio `radio_km` (por defecto 10). Los resultados se ordenan por distancia y cada mascota incluye `distancia_km`.

### Recomendaciones

| Método | Ruta | Rol | Parámetros | Respuesta |
|---|---|---|---|---|
| GET | `/recomendaciones` | Adoptante | `limite` (por defecto 12) | `Recomendacion[]` |

`Recomendacion = { mascota: Mascota, compatibilidad: number (0 a 100), razones: string[] (máximo 3) }`. Se excluyen las mascotas adoptadas y las que no alcanzan el umbral de 60 puntos. El orden es por compatibilidad descendente y, en empate, por distancia. Responde 409 si el adoptante no tiene perfil de estilo de vida. Ver el [algoritmo](#algoritmo-de-compatibilidad).

### Solicitudes (adoptante)

| Método | Ruta | Rol | Cuerpo | Respuesta |
|---|---|---|---|---|
| POST | `/solicitudes` | Adoptante | `{ mascota_id, mensaje }` | `Solicitud` |
| GET | `/solicitudes/mias` | Adoptante | | `Solicitud[]` |

Al crear una solicitud:

- Responde 422 si el adoptante no tiene perfil de estilo de vida, 404 si la mascota no existe, 409 si está adoptada y 409 si ya tiene una solicitud pendiente para ella.
- Guarda copias resumidas de `mascota`, `fundacion` y `adoptante`, este último con su perfil de estilo de vida.
- Inicia `historial_estados` con la entrada `pendiente`.
- Pasa la mascota de `disponible` a `en_proceso`.
- Notifica a la fundación (`solicitud_recibida`).

### Fundación

Todas requieren el rol `fundacion` y operan sobre la fundación de la cuenta (`usuario.fundacion_id`). Las rutas de escritura exigen además que la fundación esté **aprobada**; si no, responden 403.

| Método | Ruta | Escritura | Cuerpo / parámetros | Respuesta |
|---|---|---|---|---|
| GET | `/fundaciones/me` | | | `Fundacion` |
| GET | `/fundaciones/me/indicadores` | | | `IndicadoresFundacion` |
| GET | `/fundaciones/me/mascotas` | | `q, especie, estado` | `Mascota[]` (incluye adoptadas) |
| POST | `/mascotas` | Sí | `MascotaPayload` | `Mascota` |
| PATCH | `/mascotas/{id}` | Sí | `Partial<MascotaPayload>` | `Mascota` |
| POST | `/mascotas/{id}/historial-medico` | Sí | `{ fecha, tipo, descripcion, veterinario? }` | `Mascota` |
| POST | `/mascotas/fotos` | Sí | `multipart/form-data`, campo `archivo` | `{ url }` |
| GET | `/fundaciones/me/solicitudes` | | | `Solicitud[]` |
| PATCH | `/solicitudes/{id}/resolver` | Sí | `{ estado: "aprobada" \| "rechazada", nota? }` | `Solicitud` |

- `IndicadoresFundacion = { mascotas_publicadas, mascotas_disponibles, mascotas_en_proceso, mascotas_adoptadas, solicitudes_pendientes }`.
- Publicar una mascota: el servidor asigna `estado: "disponible"`, `fundacion_id`, el resumen `fundacion` y `fecha_publicacion`, y asigna un `_id` a cada registro de `historial_medico`.
- `atributos_especie` depende de la especie:

  | Especie | Atributos |
  |---|---|
  | Perro | `nivel_energia`, `necesita_patio`, `apto_con_ninos`, `apto_con_gatos`, `entrenado` |
  | Gato | `usa_arenero`, `apto_con_perros`, `apto_con_ninos`, `solo_interior` |
  | Conejo | `usa_arenero`, `tipo_pelaje`, `apto_con_ninos`, `requiere_jaula_amplia` |

- `PATCH /mascotas/{id}` responde 403 si la mascota es de otra fundación.
- El historial médico se agrega con `$push` sobre el arreglo embebido. La fecha no puede ser futura.
- `POST /mascotas/fotos` devuelve la URL pública que luego se guarda en `fotos`. Responde 422 si el archivo no es una imagen (JPG, PNG o WebP) o si supera 8 MB. El frontend admite hasta 6 fotos por mascota; la primera es la portada.
- `PATCH /solicitudes/{id}/resolver`: ver [reglas de negocio](#reglas-de-negocio). Responde 404 si la solicitud es de otra fundación, 409 si ya fue resuelta y 422 si se rechaza sin nota.

### Notificaciones

| Método | Ruta | Rol | Parámetros | Respuesta |
|---|---|---|---|---|
| GET | `/notificaciones` | Con sesión | `solo_no_leidas` (bool), `limite` | `Notificacion[]`, de la más reciente a la más antigua |
| GET | `/notificaciones/no-leidas/total` | Con sesión | | `{ total }` |
| PATCH | `/notificaciones/{id}/leida` | Con sesión | | `Notificacion` |
| PATCH | `/notificaciones/leer-todas` | Con sesión | | `{ actualizadas }` |

`Notificacion = { _id, usuario_id, tipo, titulo, mensaje, leida, enlace?, fecha }`.

- `tipo` es uno de: `solicitud_recibida`, `solicitud_aprobada`, `solicitud_rechazada`, `fundacion_pendiente`, `fundacion_aprobada`, `fundacion_rechazada`.
- `enlace` es una ruta del frontend: `/fundacion/solicitudes`, `/adoptante/solicitudes`, `/admin/fundaciones` o `/fundacion`.

### Administración

Todas requieren el rol `administrador`.

| Método | Ruta | Cuerpo / parámetros | Respuesta |
|---|---|---|---|
| GET | `/admin/fundaciones` | `estado?`, `q?` (nombre o NIT) | `FundacionAdmin[]` |
| PATCH | `/admin/fundaciones/{id}/validacion` | `{ estado_validacion: "aprobada" \| "rechazada", motivo_rechazo? }` | `FundacionAdmin` |
| GET | `/admin/usuarios` | `q?` (nombre o correo), `rol?`, `activo?` | `Usuario[]` |
| PATCH | `/admin/usuarios/{id}/estado` | `{ activo: boolean }` | `Usuario` |

- `FundacionAdmin` es `Fundacion` más `representante: { _id, nombre, correo, activo }`, obtenido con `$lookup` sobre `usuarios`.
- Validación de fundaciones:
  - Solo aplica a fundaciones pendientes; en otro estado responde 409.
  - El rechazo exige `motivo_rechazo`; sin él responde 422.
  - Registra `fecha_validacion` y notifica a la cuenta de la fundación (`fundacion_aprobada` o `fundacion_rechazada`).
- Estado de usuarios:
  - Es un **borrado lógico**: solo cambia `activo` y nunca elimina documentos.
  - Una cuenta inactiva no puede iniciar sesión (403) y sus tokens vigentes reciben 401.
  - El administrador no puede desactivarse a sí mismo (409).
- Ninguna respuesta debe incluir la contraseña ni su hash.

### Formas principales

Definidas en `src/types`. Resumen de los campos de cada colección:

| Tipo | Campos |
|---|---|
| `Usuario` | `_id, nombre, correo, telefono?, rol, activo, ciudad?, ubicacion?, perfil_estilo_vida?, fundacion_id?, fecha_registro` |
| `PerfilEstiloVida` | `tipo_vivienda, tiene_patio, horas_disponibles, tiene_ninos, tiene_otras_mascotas, otras_mascotas[], experiencia_previa, especies_preferidas[], tamanos_preferidos[], actualizado_en?` |
| `Fundacion` | `_id, usuario_id, nombre, nit, descripcion, direccion, ciudad, localidad?, telefono, correo, sitio_web?, ubicacion?, estado_validacion, motivo_rechazo?, fecha_registro, fecha_validacion?` |
| `Mascota` | `_id, nombre, especie, raza, sexo, edad_meses, tamano, descripcion, temperamento[], fotos[], estado, atributos_especie, historial_medico[], esterilizado, fundacion_id, fundacion{ _id, nombre, ciudad, localidad?, telefono?, correo? }, ubicacion, fecha_publicacion, actualizado_en?, distancia_km?` |
| `Solicitud` | `_id, mascota_id, adoptante_id, fundacion_id, estado, mensaje, mascota{ nombre, especie, foto? }, fundacion{ nombre }, adoptante{ nombre, correo, telefono?, ciudad?, perfil_estilo_vida? }, historial_estados[{ estado, fecha, nota? }], fecha_creacion, fecha_actualizacion` |

Valores enumerados:

| Campo | Valores |
|---|---|
| `rol` | `adoptante`, `fundacion`, `administrador` |
| `especie` | `perro`, `gato`, `conejo` |
| `sexo` | `macho`, `hembra` |
| `tamano` | `pequeno`, `mediano`, `grande` |
| `estado` (mascota) | `disponible`, `en_proceso`, `adoptada` |
| `estado` (solicitud) | `pendiente`, `aprobada`, `rechazada` |
| `estado_validacion` | `pendiente`, `aprobada`, `rechazada` |
| `tipo_vivienda` | `apartamento`, `casa`, `finca` |
| `temperamento` | `tranquilo`, `jugueton`, `sociable`, `carinoso`, `timido`, `independiente`, `activo`, `protector` |
| `historial_medico[].tipo` | `vacuna`, `desparasitacion`, `esterilizacion`, `consulta`, `cirugia`, `tratamiento` |

## Notificaciones en tiempo real (WebSocket)

- **Conexión**: `VITE_WS_URL?token=<JWT>`, por defecto `ws://localhost:8000/ws/notificaciones?token=...`.
- **Origen**: el servidor observa la colección `notificaciones` con un **change stream** (`operationType: insert`) y reenvía cada documento nuevo solo a las conexiones de su `usuario_id`. Los change streams exigen el replica set de MongoDB.
- **Mensaje**: `{ "evento": "notificacion", "datos": Notificacion }`.
- **Token inválido**: el servidor cierra con el código **4401** y el frontend no reintenta. Ante cualquier otro cierre, el frontend se reconecta con espera exponencial: 1 s, 2 s, 4 s, hasta un máximo de 30 s.
- **Al recibir un mensaje**, el frontend:
  - suma uno al contador de la campana;
  - inserta la notificación en las listas en caché;
  - muestra un aviso con el botón "Ver";
  - refresca los datos que dependen de ella, por ejemplo la bandeja de la fundación con `solicitud_recibida` o el estado de la fundación con `fundacion_aprobada`.
- **Indicador de conexión**: la campana y la página de notificaciones muestran el estado: en tiempo real, conectando o sin conexión.

## Reglas de negocio

- **Estados de la mascota**: `disponible` pasa a `en_proceso` con la primera solicitud pendiente, y `en_proceso` pasa a `adoptada` cuando se aprueba una solicitud.
- **Aprobar una solicitud** debe ejecutarse en **una sola transacción**:
  1. Aprueba la solicitud y agrega la entrada al historial.
  2. Rechaza automáticamente las demás solicitudes pendientes de la misma mascota, con la nota "Rechazada automáticamente: se aprobó otra solicitud para esta mascota.".
  3. Marca la mascota como `adoptada`.
  4. Notifica al adoptante aprobado (`solicitud_aprobada`) y a cada adoptante rechazado (`solicitud_rechazada`).

  El diálogo de confirmación del frontend nombra a los adoptantes que serán rechazados.
- **Rechazar una solicitud** exige un motivo (mínimo 10 caracteres en el frontend), que se guarda como `nota` en el historial. Si no quedan solicitudes pendientes, la mascota vuelve a `disponible`. El adoptante recibe `solicitud_rechazada`.
- **Resolver dos veces** la misma solicitud responde 409.
- **Fundaciones pendientes o rechazadas** pueden ingresar y ver su panel con un aviso, pero no publicar ni resolver solicitudes (403).
- **Adoptantes sin perfil** de estilo de vida no pueden enviar solicitudes (422) ni recibir recomendaciones (409).
- **El catálogo** oculta las mascotas adoptadas; la gestión de la fundación las muestra todas.
- **Desactivar usuarios** es un borrado lógico y es reversible.

## Algoritmo de compatibilidad

`GET /recomendaciones` calcula hasta 100 puntos por mascota cruzando el perfil del adoptante con la mascota. La implementación de referencia está en `src/mocks/compatibilidad.ts`.

| Criterio | Máx. | Regla |
|---|---|---|
| Especie preferida | 20 | 20 si coincide; 12 si no hay preferencia; 0 si no coincide |
| Espacio de la vivienda | 20 | Perro que necesita patio sin patio: 0. Casa, finca o patio: 20. Apartamento: pequeño 20, mediano 15, grande 6. Conejo con jaula amplia en apartamento: 13. Gato activo en apartamento: 16. Resto: 20. |
| Tiempo disponible | 15 | Horas necesarias: perro de energía baja 2, media 3, alta 5; gato 2, o 3 si es activo; conejo 2. Si sobran 2 h o más: 15; si sobra 1 h: 12; si es justo: 9; si falta: proporcional sobre 9. |
| Tamaño preferido | 10 | 10 si coincide; 6 si no hay preferencia; 0 si no coincide |
| Convivencia con niños | 10 | 10 sin niños o si la mascota es apta; 0 si no |
| Convivencia con mascotas | 10 | 10 sin otras mascotas o si es compatible con todas; 0 si no |
| Cercanía | 10 | Hasta 3 km: 10; hasta 8 km: 7; hasta 15 km: 4; más lejos: 2; sin ubicación del adoptante: 6 |
| Experiencia | 5 | 5 con experiencia; 3 sin experiencia si la mascota no es exigente; 0 si lo es |

Las razones son las frases de los criterios con mayor aporte, ordenadas de mayor a menor; se devuelven como máximo tres. Solo se recomiendan mascotas con 60 puntos o más.

## Diseño y accesibilidad

- **Identidad visual**: paleta cálida (terracota como color principal, verde pino como secundario y arena como neutro); tipografías Fraunces para títulos y Plus Jakarta Sans para texto. Todos los valores son tokens definidos en `tailwind.config.ts` y `src/index.css`.
- **Gráficos**: la paleta del panel de la fundación se validó para contraste y para distinguirse con daltonismo. El reparto por estado nunca depende solo del color: cada segmento tiene etiqueta, número y porcentaje.
- **Estados de interfaz**: skeletons durante la carga, estados vacíos ilustrados, errores con opción de reintentar y avisos de confirmación en las acciones irreversibles.
- **Diseño adaptable**: celular, tableta y escritorio. Las tablas se convierten en tarjetas en celular y la navegación de los paneles pasa a un menú lateral.
- **Accesibilidad**:
  - Enlace para saltar al contenido.
  - Etiquetas asociadas a cada campo, con los errores anunciados mediante `aria-describedby`.
  - Navegación completa con teclado y foco visible.
  - Texto alternativo en las fotos.
  - Colores de texto elegidos para cumplir el contraste AA sobre los fondos del sistema.
  - Se respeta `prefers-reduced-motion`.
