"""Modelos SQLAlchemy. Importarlos aquí permite que Alembic los detecte."""

from app.db.postgres.models.adoption import Adoption, AdoptionRequest
from app.db.postgres.models.foundation import Foundation
from app.db.postgres.models.user import User

__all__ = ["Adoption", "AdoptionRequest", "Foundation", "User"]
