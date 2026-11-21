"""Pruebas de hash de contraseñas, JWT y control de roles."""

import pytest
from jose import JWTError

from app.core.roles import UserRole
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_password_hash_roundtrip():
    hashed = hash_password("clave-segura-123")
    assert hashed != "clave-segura-123"
    assert verify_password("clave-segura-123", hashed)
    assert not verify_password("otra-clave", hashed)


def test_access_token_contains_subject_and_role():
    token = create_access_token(subject=42, role=UserRole.FOUNDATION)
    payload = decode_access_token(token)
    assert payload["sub"] == "42"
    assert payload["role"] == "foundation"


def test_expired_token_is_rejected():
    token = create_access_token(subject=1, role=UserRole.ADOPTER, expires_minutes=-1)
    with pytest.raises(JWTError):
        decode_access_token(token)


async def test_protected_route_requires_token(client):
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401


async def test_role_restricted_route_rejects_wrong_role(client):
    token = create_access_token(subject=1, role=UserRole.ADOPTER)
    response = await client.get(
        "/api/v1/users", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403
