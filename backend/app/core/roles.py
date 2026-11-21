"""Roles de usuario del sistema."""

from enum import StrEnum


class UserRole(StrEnum):
    ADOPTER = "adopter"        # adoptante
    FOUNDATION = "foundation"  # fundación
    ADMIN = "admin"            # administrador
