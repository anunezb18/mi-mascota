"""Búsquedas de texto sin distinguir mayúsculas ni tildes."""

import re

_VARIANTES = {
    "a": "aáàä",
    "e": "eéèë",
    "i": "iíìï",
    "o": "oóòö",
    "u": "uúùü",
    "n": "nñ",
}
_SIN_TILDE = str.maketrans("áàäéèëíìïóòöúùüñ", "aaaeeeiiiooouuun")


def regex_flexible(texto: str) -> str:
    """Patrón $regex que encuentra el texto con o sin tildes: "pena" encuentra "Peña"."""
    patron = []
    for caracter in texto.strip().lower().translate(_SIN_TILDE):
        if caracter in _VARIANTES:
            patron.append(f"[{_VARIANTES[caracter]}]")
        else:
            patron.append(re.escape(caracter))
    return "".join(patron)


def regex_digitos(texto: str) -> str | None:
    """Patrón para buscar un NIT por sus dígitos, ignorando puntos y guion: "901678" encuentra "901.678.234-5"."""
    digitos = re.sub(r"\D", "", texto)
    return "[.-]?".join(digitos) if digitos else None
