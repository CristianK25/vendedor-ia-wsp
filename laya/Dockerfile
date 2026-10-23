FROM python:3.11-slim

WORKDIR /app

# Instalamos curl para healthchecks y herramientas esenciales
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalamos PyTorch optimizado para CPU (pesa ~200MB en vez de 3GB de CUDA) y Laya con su servidor HTTP
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir "laya[serve]"

# Configuraciones del servidor Laya
ENV PYTHONUNBUFFERED=1
ENV LAYA_DEVICE=cpu
ENV LAYA_MODELS=multilingual
ENV LAYA_PRELOAD=1
ENV LAYA_PORT=8000

EXPOSE 8000

CMD ["laya-serve"]
