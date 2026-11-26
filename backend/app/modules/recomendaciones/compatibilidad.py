"""Compatibilidad entre el perfil de estilo de vida del adoptante y una mascota (0 a 100 puntos).

Criterio                     Máx.  Regla
Especie preferida ........... 20   20 si coincide; 12 sin preferencia; 0 si no coincide
Espacio de la vivienda ...... 20   según tamaño, necesidad de patio y tipo de vivienda
Tiempo disponible ........... 15   15 si sobran 2 h o más, 12 si sobra 1 h, 9 si es justo; proporcional si falta
Tamaño preferido ............ 10   10 si coincide; 6 sin preferencia; 0 si no coincide
Convivencia con niños ....... 10   10 sin niños o si es apta; 0 si no
Convivencia con mascotas .... 10   10 sin mascotas o si es compatible con todas; 0 si no
Cercanía .................... 10   hasta 3 km 10, 8 km 7, 15 km 4, más lejos 2; 6 sin ubicación
Experiencia ................. 5    5 con experiencia; 3 sin experiencia si la mascota no es exigente; 0 si lo es

Las razones son las frases de los criterios con mayor aporte (máximo tres).
Es la misma lógica del modo mock del frontend (src/mocks/compatibilidad.ts).
"""

from typing import Any

ESPECIE = {"perro": "perro", "gato": "gato", "conejo": "conejo"}
VIVIENDA = {"apartamento": "apartamento", "casa": "casa", "finca": "finca"}
TAMANO = {"pequeno": "pequeño", "mediano": "mediano", "grande": "grande"}


def horas_necesarias(m: dict[str, Any]) -> int:
    if m["especie"] == "perro":
        return {"bajo": 2, "medio": 3, "alto": 5}[m["atributos_especie"]["nivel_energia"]]
    if m["especie"] == "gato":
        return 3 if "activo" in m["temperamento"] else 2
    return 2


def puntaje_espacio(m: dict[str, Any], p: dict[str, Any]) -> int:
    amplio = p["tipo_vivienda"] != "apartamento"
    a = m["atributos_especie"]
    if m["especie"] == "perro":
        if a["necesita_patio"] and not p["tiene_patio"]:
            return 0
        if amplio or p["tiene_patio"]:
            return 20
        return {"pequeno": 20, "mediano": 15, "grande": 6}[m["tamano"]]
    if m["especie"] == "conejo":
        return 13 if a["requiere_jaula_amplia"] and not amplio else 20
    return 16 if "activo" in m["temperamento"] and not amplio else 20


def puntaje_tiempo(horas: float, necesarias: int) -> int:
    margen = horas - necesarias
    if margen >= 2:
        return 15
    if margen >= 1:
        return 12
    if margen >= 0:
        return 9
    return round((horas / necesarias) * 9)


def puntaje_cercania(km: float | None) -> int:
    if km is None:
        return 6
    if km <= 3:
        return 10
    if km <= 8:
        return 7
    if km <= 15:
        return 4
    return 2


def formato_distancia(km: float) -> str:
    if km < 1:
        return f"{round(km * 1000)} m"
    return f"{round(km, 1):g} km".replace(".", ",")


def calcular(m: dict[str, Any], p: dict[str, Any]) -> dict[str, Any]:
    razones: list[tuple[int, str]] = []
    total = 0

    def sumar(puntos: int, texto: str | None = None, minimo_razon: int = 0) -> None:
        nonlocal total
        total += puntos
        if texto and puntos >= minimo_razon and puntos > 0:
            razones.append((puntos, texto))

    especie = ESPECIE[m["especie"]]
    vivienda = VIVIENDA[p["tipo_vivienda"]]
    a = m["atributos_especie"]

    # Especie
    if not p["especies_preferidas"]:
        sumar(12)
    elif m["especie"] in p["especies_preferidas"]:
        sumar(20, f"Es un {especie}, una de las especies que prefiere.")

    # Espacio
    necesita_patio = m["especie"] == "perro" and a["necesita_patio"]
    sumar(
        puntaje_espacio(m, p),
        "Necesita patio y su hogar cuenta con uno." if necesita_patio else f"Se adapta bien a vivir en {vivienda}.",
        20,
    )

    # Tiempo disponible frente a la energía de la mascota
    necesarias = horas_necesarias(m)
    horas = p["horas_disponibles"]
    sumar(
        puntaje_tiempo(horas, necesarias),
        f"Sus {horas:g} h diarias cubren el tiempo que necesita (unas {necesarias} h).",
        12,
    )

    # Tamaño
    if not p["tamanos_preferidos"]:
        sumar(6)
    elif m["tamano"] in p["tamanos_preferidos"]:
        sumar(10, f"Su tamaño ({TAMANO[m['tamano']]}) coincide con lo que busca.")

    # Niños
    if not p["tiene_ninos"]:
        sumar(10)
    elif a["apto_con_ninos"]:
        sumar(10, "Convive bien con niños.")

    # Otras mascotas
    if not p["tiene_otras_mascotas"] or not p["otras_mascotas"]:
        sumar(10)
    else:

        def convive(otra: str) -> bool:
            if m["especie"] == "perro" and otra == "gato":
                return a["apto_con_gatos"]
            if m["especie"] == "gato" and otra == "perro":
                return a["apto_con_perros"]
            if m["especie"] == "conejo" and otra == "perro":
                return False
            return "sociable" in m["temperamento"] or "tranquilo" in m["temperamento"]

        if all(convive(o) for o in p["otras_mascotas"]):
            sumar(10, "Puede convivir con las mascotas que ya tiene.")

    # Cercanía
    km = m.get("distancia_km")
    sumar(puntaje_cercania(km), f"Está a solo {formato_distancia(km)} de usted." if km is not None else None, 10)

    # Experiencia
    exigente = (
        "independiente" in m["temperamento"]
        or "protector" in m["temperamento"]
        or (m["especie"] == "perro" and a["nivel_energia"] == "alto")
    )
    if p["experiencia_previa"]:
        sumar(5, "Su experiencia previa le ayudará con su temperamento." if exigente else None)
    elif not exigente:
        sumar(3)

    razones.sort(key=lambda r: r[0], reverse=True)
    return {"mascota": m, "compatibilidad": min(100, total), "razones": [texto for _, texto in razones[:3]]}
