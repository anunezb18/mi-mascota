FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Instala dependencias primero para aprovechar la caché de capas
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

# Ejecuta la aplicación con un usuario sin privilegios
RUN useradd --create-home appuser
USER appuser

EXPOSE 8000

# En desarrollo, docker-compose sobrescribe este comando para añadir --reload
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
