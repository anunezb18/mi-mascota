"""Router principal de la API versionada (/api/v1)."""

from fastapi import APIRouter

from app.api.routes import adoption_requests, auth, foundations, pets, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(foundations.router, prefix="/foundations", tags=["foundations"])
api_router.include_router(pets.router, prefix="/pets", tags=["pets"])
api_router.include_router(
    adoption_requests.router, prefix="/adoption-requests", tags=["adoption-requests"]
)
