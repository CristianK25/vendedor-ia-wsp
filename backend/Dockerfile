FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias necesarias para compilar drivers como psycopg2 si los hay
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Para que Python encuentre el paquete 'app'
ENV PYTHONPATH=/app

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
