"""NIT colombiano: normalización y dígito de verificación (algoritmo de la DIAN)."""

import re

_PESOS = (3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71)


def digito_verificacion(base: str) -> int:
    suma = sum(int(d) * peso for d, peso in zip(reversed(base), _PESOS, strict=False))
    residuo = suma % 11
    return residuo if residuo < 2 else 11 - residuo


def normalizar_nit(nit: str) -> str | None:
    """'901234567-1' o '901.234.567-1' -> '901.234.567-1'. None si no tiene el formato esperado."""
    digitos = re.sub(r"\D", "", nit)
    if len(digitos) != 10:
        return None
    base, dv = digitos[:9], digitos[9]
    return f"{base[:3]}.{base[3:6]}.{base[6:]}-{dv}"


def nit_valido(nit_normalizado: str) -> bool:
    digitos = re.sub(r"\D", "", nit_normalizado)
    return digito_verificacion(digitos[:9]) == int(digitos[9])
