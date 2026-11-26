"""Pruebas de integración contra la API en ejecución con los datos de demostración.

Uso (con `docker compose up` corriendo):
    pip install -r requirements-dev.txt
    pytest tests/integration -v

Variables opcionales: API_URL (por defecto http://localhost:8000/api) y WS_URL.
Las pruebas crean cuentas propias con correos únicos, así que pueden repetirse;
los registros que crean quedan en la base de datos.
"""

import json
import os
import struct
import uuid
import zlib

import httpx
import pytest
from websockets.sync.client import connect

API = os.getenv("API_URL", "http://localhost:8000/api")
WS = os.getenv("WS_URL", "ws://localhost:8000/ws/notificaciones")
CLAVE_DEMO = "MiMascota2026"


@pytest.fixture(scope="module")
def http():
    with httpx.Client(base_url=API, timeout=15) as cliente:
        yield cliente


def login(http: httpx.Client, correo: str, contrasena: str = CLAVE_DEMO) -> dict:
    r = http.post("/auth/login", json={"correo": correo, "contrasena": contrasena})
    assert r.status_code == 200, r.text
    return r.json()


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def unico(prefijo: str) -> str:
    return f"{prefijo}.{uuid.uuid4().hex[:8]}@pruebas.co"


def nit_aleatorio() -> str:
    from app.modules.fundaciones.nit import digito_verificacion

    base = f"9{uuid.uuid4().int % 10**8:08d}"
    return f"{base[:3]}.{base[3:6]}.{base[6:]}-{digito_verificacion(base)}"


def png_minimo() -> bytes:
    def bloque(tipo: bytes, datos: bytes) -> bytes:
        return struct.pack(">I", len(datos)) + tipo + datos + struct.pack(">I", zlib.crc32(tipo + datos))

    return (
        b"\x89PNG\r\n\x1a\n"
        + bloque(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0))
        + bloque(b"IDAT", zlib.compress(b"\x00\xff\x00\x00"))
        + bloque(b"IEND", b"")
    )


PERFIL = {
    "tipo_vivienda": "casa",
    "tiene_patio": True,
    "horas_disponibles": 6,
    "tiene_ninos": False,
    "tiene_otras_mascotas": False,
    "otras_mascotas": [],
    "experiencia_previa": True,
    "especies_preferidas": ["perro"],
    "tamanos_preferidos": ["mediano"],
}


def mascota_payload(nombre: str) -> dict:
    return {
        "nombre": nombre,
        "especie": "perro",
        "raza": "Mestizo",
        "sexo": "macho",
        "edad_meses": 18,
        "tamano": "mediano",
        "esterilizado": True,
        "descripcion": "Perro de prueba muy tranquilo y cariñoso, ideal para una familia con patio.",
        "temperamento": ["tranquilo", "carinoso"],
        "fotos": ["https://images.dog.ceo/breeds/mix/uhie.jpg"],
        "atributos_especie": {
            "nivel_energia": "medio",
            "necesita_patio": False,
            "apto_con_ninos": True,
            "apto_con_gatos": True,
            "entrenado": True,
        },
        "ubicacion": {"type": "Point", "coordinates": [-74.0836, 4.7417]},
        "historial_medico": [{"fecha": "2026-01-10T12:00:00Z", "tipo": "vacuna", "descripcion": "Vacuna múltiple"}],
    }


def test_salud(http):
    assert http.get("/health").json()["estado"] == "ok"


def test_inicio_de_sesion(http):
    sesion = login(http, "adoptante@mimascota.co")
    assert sesion["usuario"]["rol"] == "adoptante" and "contrasena_hash" not in sesion["usuario"]
    assert http.post("/auth/login", json={"correo": "adoptante@mimascota.co", "contrasena": "mala1234"}).status_code == 401
    assert http.post("/auth/login", json={"correo": "mariana.lozano@correo.co", "contrasena": CLAVE_DEMO}).status_code == 403
    assert http.get("/auth/me").status_code == 401


def test_catalogo(http):
    todas = http.get("/mascotas").json()
    assert todas and all(m["estado"] != "adoptada" for m in todas)
    assert http.get("/mascotas", params={"q": "simon"}).json()[0]["nombre"] == "Simón"
    rasgos = http.get("/mascotas", params=[("temperamento", "jugueton"), ("temperamento", "activo")]).json()
    assert all({"jugueton", "activo"} <= set(m["temperamento"]) for m in rasgos)
    assert all(m["edad_meses"] < 12 for m in http.get("/mascotas", params={"etapa": "cachorro"}).json())
    cerca = http.get("/mascotas", params={"lat": 4.6534, "lng": -74.0636, "radio_km": 5}).json()
    distancias = [m["distancia_km"] for m in cerca]
    assert distancias == sorted(distancias) and max(distancias) <= 5
    assert http.get("/mascotas/000000000000000000000000").status_code == 404


def test_flujo_completo_de_adopcion(http):
    admin = login(http, "admin@mimascota.co")

    # 1. Registro de fundación: queda pendiente y no puede publicar
    correo_f = unico("fundacion")
    datos_f = {
        "rol": "fundacion",
        "nombre": "Representante de Prueba",
        "correo": correo_f,
        "contrasena": "Clave12345",
        "telefono": "3001234567",
        "fundacion": {
            "nombre": f"Fundación Prueba {uuid.uuid4().hex[:4]}",
            "nit": "900.123.456-1",
            "descripcion": "Fundación creada por las pruebas de integración de MiMascota en Bogotá.",
            "direccion": "Calle 1 # 2-3",
            "ciudad": "Bogotá",
        },
    }
    assert http.post("/auth/registro", json=datos_f).status_code == 422  # dígito de verificación inválido
    datos_f["fundacion"]["nit"] = nit_aleatorio()
    r = http.post("/auth/registro", json=datos_f)
    assert r.status_code == 201, r.text
    fundacion = r.json()
    hf = auth(fundacion["access_token"])
    mia = http.get("/fundaciones/me", headers=hf).json()
    assert mia["estado_validacion"] == "pendiente"
    assert http.post("/mascotas", json=mascota_payload("Prueba"), headers=hf).status_code == 403

    # 2. El administrador fue notificado y la aprueba
    avisos = http.get("/notificaciones", headers=auth(admin["access_token"])).json()
    assert any(datos_f["fundacion"]["nombre"] in n["mensaje"] for n in avisos)
    r = http.patch(
        f"/admin/fundaciones/{mia['_id']}/validacion",
        json={"estado_validacion": "aprobada"},
        headers=auth(admin["access_token"]),
    )
    assert r.status_code == 200 and r.json()["representante"]["correo"] == correo_f
    assert http.patch(
        f"/admin/fundaciones/{mia['_id']}/validacion",
        json={"estado_validacion": "rechazada", "motivo_rechazo": "Motivo de prueba"},
        headers=auth(admin["access_token"]),
    ).status_code == 409

    # 3. Publica una mascota, la edita, agrega historial y sube una foto (GridFS)
    r = http.post("/mascotas", json=mascota_payload("Rufo"), headers=hf)
    assert r.status_code == 201, r.text
    rufo = r.json()
    assert rufo["estado"] == "disponible" and rufo["fundacion"]["nombre"] == datos_f["fundacion"]["nombre"]
    assert http.patch(f"/mascotas/{rufo['_id']}", json={"especie": "gato"}, headers=hf).status_code == 422
    assert http.patch(f"/mascotas/{rufo['_id']}", json={"nombre": "Rufo II"}, headers=hf).json()["nombre"] == "Rufo II"
    r = http.post(
        f"/mascotas/{rufo['_id']}/historial-medico",
        json={"fecha": "2026-03-01T12:00:00Z", "tipo": "desparasitacion", "descripcion": "Desparasitación interna"},
        headers=hf,
    )
    assert [h["tipo"] for h in r.json()["historial_medico"]] == ["desparasitacion", "vacuna"]
    r = http.post("/mascotas/fotos", files={"archivo": ("foto.png", png_minimo(), "image/png")}, headers=hf)
    assert r.status_code == 201, r.text
    foto = httpx.get(r.json()["url"])
    assert foto.status_code == 200 and foto.headers["content-type"] == "image/png"
    assert http.post("/mascotas/fotos", files={"archivo": ("a.txt", b"hola", "text/plain")}, headers=hf).status_code == 422

    # 4. Dos adoptantes nuevos; sin perfil no pueden solicitar
    adoptantes = []
    for i in range(2):
        r = http.post(
            "/auth/registro",
            json={"rol": "adoptante", "nombre": f"Adoptante Prueba {i}", "correo": unico("adoptante"), "contrasena": "Clave12345", "ciudad": "Bogotá"},
        )
        assert r.status_code == 201, r.text
        adoptantes.append(auth(r.json()["access_token"]))
    solicitud = {"mascota_id": rufo["_id"], "mensaje": "Me encantaría adoptar a Rufo, tengo casa con patio y tiempo."}
    assert http.post("/solicitudes", json=solicitud, headers=adoptantes[0]).status_code == 422
    assert http.get("/recomendaciones", headers=adoptantes[0]).status_code == 409
    for h in adoptantes:
        assert http.put("/usuarios/me/perfil-estilo-vida", json=PERFIL, headers=h).status_code == 200
    recomendaciones = http.get("/recomendaciones", headers=adoptantes[0]).json()
    assert recomendaciones and all(r["compatibilidad"] >= 60 and len(r["razones"]) <= 3 for r in recomendaciones)

    # 5. La fundación recibe la solicitud en tiempo real (change stream -> WebSocket)
    with connect(f"{WS}?token={fundacion['access_token']}", open_timeout=10) as ws:
        r = http.post("/solicitudes", json=solicitud, headers=adoptantes[0])
        assert r.status_code == 201, r.text
        primera = r.json()
        mensaje = json.loads(ws.recv(timeout=10))
        assert mensaje["evento"] == "notificacion" and mensaje["datos"]["tipo"] == "solicitud_recibida"
    assert http.get(f"/mascotas/{rufo['_id']}").json()["estado"] == "en_proceso"
    assert http.post("/solicitudes", json=solicitud, headers=adoptantes[0]).status_code == 409
    segunda = http.post("/solicitudes", json=solicitud, headers=adoptantes[1]).json()
    assert http.get("/fundaciones/me/indicadores", headers=hf).json()["solicitudes_pendientes"] == 2

    # 6. Aprobación transaccional: rechaza la otra y marca la mascota como adoptada
    assert http.patch(f"/solicitudes/{primera['_id']}/resolver", json={"estado": "rechazada"}, headers=hf).status_code == 422
    r = http.patch(f"/solicitudes/{primera['_id']}/resolver", json={"estado": "aprobada", "nota": "¡Bienvenido!"}, headers=hf)
    assert r.status_code == 200 and r.json()["estado"] == "aprobada"
    otra = next(s for s in http.get("/solicitudes/mias", headers=adoptantes[1]).json() if s["_id"] == segunda["_id"])
    assert otra["estado"] == "rechazada" and "automáticamente" in otra["historial_estados"][-1]["nota"]
    assert http.get(f"/mascotas/{rufo['_id']}").json()["estado"] == "adoptada"
    assert rufo["_id"] not in {m["_id"] for m in http.get("/mascotas").json()}
    assert http.patch(f"/solicitudes/{primera['_id']}/resolver", json={"estado": "rechazada", "nota": "x" * 12}, headers=hf).status_code == 409
    tipos = {n["tipo"] for n in http.get("/notificaciones", headers=adoptantes[1]).json()}
    assert "solicitud_rechazada" in tipos

    # 7. Rechazar la única pendiente devuelve la mascota a disponible
    luna = http.post("/mascotas", json=mascota_payload("Luna Prueba"), headers=hf).json()
    s = http.post("/solicitudes", json={**solicitud, "mascota_id": luna["_id"]}, headers=adoptantes[1]).json()
    http.patch(f"/solicitudes/{s['_id']}/resolver", json={"estado": "rechazada", "nota": "Buscamos un hogar con más tiempo."}, headers=hf)
    assert http.get(f"/mascotas/{luna['_id']}").json()["estado"] == "disponible"

    # 8. Cuenta: el nombre se propaga a las copias en solicitudes y cambia la contraseña
    http.patch("/usuarios/me", json={"nombre": "Adoptante Renombrado", "telefono": ""}, headers=adoptantes[0])
    assert http.get("/solicitudes/mias", headers=adoptantes[0]).json()[0]["adoptante"]["nombre"] == "Adoptante Renombrado"
    assert http.put("/usuarios/me/contrasena", json={"contrasena_actual": "mala", "contrasena_nueva": "Nueva12345"}, headers=adoptantes[0]).status_code == 400
    assert http.put("/usuarios/me/contrasena", json={"contrasena_actual": "Clave12345", "contrasena_nueva": "Nueva12345"}, headers=adoptantes[0]).status_code == 204

    # 9. Notificaciones: contador y marcar todas como leídas
    total = http.get("/notificaciones/no-leidas/total", headers=hf).json()["total"]
    assert total >= 1
    assert http.patch("/notificaciones/leer-todas", headers=hf).json()["actualizadas"] == total
    assert http.get("/notificaciones/no-leidas/total", headers=hf).json()["total"] == 0


def test_administracion_de_usuarios(http):
    admin = login(http, "admin@mimascota.co")
    ha = auth(admin["access_token"])
    assert http.get("/admin/usuarios", headers=auth(login(http, "adoptante@mimascota.co")["access_token"])).status_code == 403
    assert len(http.get("/admin/fundaciones", params={"q": "901678"}, headers=ha).json()) == 1
    assert len(http.get("/admin/fundaciones", params={"q": "engativa"}, headers=ha).json()) == 1
    assert all(not u["activo"] for u in http.get("/admin/usuarios", params={"activo": False}, headers=ha).json())

    r = http.post("/auth/registro", json={"rol": "adoptante", "nombre": "Cuenta Temporal", "correo": unico("temporal"), "contrasena": "Clave12345"})
    temporal = r.json()
    ht = auth(temporal["access_token"])
    assert http.patch(f"/admin/usuarios/{admin['usuario']['_id']}/estado", json={"activo": False}, headers=ha).status_code == 409
    assert http.patch(f"/admin/usuarios/{temporal['usuario']['_id']}/estado", json={"activo": False}, headers=ha).json()["activo"] is False
    assert http.get("/auth/me", headers=ht).status_code == 401
    assert http.post("/auth/login", json={"correo": temporal["usuario"]["correo"], "contrasena": "Clave12345"}).status_code == 403
    http.patch(f"/admin/usuarios/{temporal['usuario']['_id']}/estado", json={"activo": True}, headers=ha)
    assert http.get("/auth/me", headers=ht).status_code == 200
