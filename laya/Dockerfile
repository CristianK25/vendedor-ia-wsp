FROM python:3.11-slim

WORKDIR /app

# Instalamos curl para healthchecks y herramientas esenciales
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalamos PyTorch optimizado para CPU y Laya con servidor HTTP
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir "laya[serve]"

# Directorio explícito e independiente para almacenar los pesos del modelo
ENV HF_HOME=/cache
RUN mkdir -p /cache

# Configuraciones del servidor Laya
ENV PYTHONUNBUFFERED=1
ENV LAYA_DEVICE=cpu
ENV LAYA_MODELS=multilingual
ENV LAYA_PRELOAD=1
ENV LAYA_PORT=8000

# Control estricto de concurrencia de hilos en CPU:
# Al fijar 1 solo hilo en PyTorch/OpenMP evitamos que compita con PostgreSQL, n8n y FastAPI
ENV LAYA_THREADS=1
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1

EXPOSE 8000

CMD ["laya-serve"]
