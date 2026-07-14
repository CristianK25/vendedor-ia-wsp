#!/usr/bin/env bash

# Script de Inicialización para el Agente de Ventas IA
# Este script prepara el entorno .env y autogenera claves de seguridad.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

ENV_FILE="$PROJECT_ROOT/.env"
ENV_EXAMPLE="$PROJECT_ROOT/.env.example"

echo "=== Iniciando configuración del entorno ==="

# 0. Preparar directorios y permisos para evitar fallos en la VPS
echo "📁 Configurando permisos del volumen de datos..."
mkdir -p "$PROJECT_ROOT/n8n_data"
# Usamos Alpine para asignar la propiedad de la carpeta al usuario 'node' (UID 1000) 
# de forma segura, sin importar qué usuario ejecuta el script en la VPS.
docker run --rm -v "$PROJECT_ROOT/n8n_data:/data" alpine chown -R 1000:1000 /data


# 1. Verificar si ya existe el archivo .env
if [ -f "$ENV_FILE" ]; then
    echo "⚠️ El archivo .env ya existe. No se sobrescribirán las configuraciones actuales."
    # Inyectar N8N_API_KEY si no existe
    if ! grep -q "^N8N_API_KEY=" "$ENV_FILE"; then
        echo "🔑 Generando nueva N8N_API_KEY para red interna en el archivo .env existente..."
        if command -v openssl >/dev/null 2>&1; then
            API_KEY=$(openssl rand -hex 32)
        else
            API_KEY=$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 40)
        fi
        echo "" >> "$ENV_FILE"
        echo "# Clave para la red interna M2M entre n8n y Backend" >> "$ENV_FILE"
        echo "N8N_API_KEY=$API_KEY" >> "$ENV_FILE"
        echo "✅ N8N_API_KEY añadida exitosamente."
    fi
else
    # 2. Copiar .env.example a .env
    if [ -f "$ENV_EXAMPLE" ]; then
        echo "📋 Copiando $ENV_EXAMPLE a $ENV_FILE..."
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        
        # 3. Generar claves aleatorias seguras usando openssl (o dev/urandom como fallback)
        echo "🔑 Generando claves de seguridad (n8n, API y Postgres)..."
        if command -v openssl >/dev/null 2>&1; then
            SECURE_KEY=$(openssl rand -hex 24)
            DB_PASS=$(openssl rand -hex 16)
            API_KEY=$(openssl rand -hex 32)
        else
            SECURE_KEY=$(head -c 24 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 32)
            DB_PASS=$(head -c 16 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 24)
            API_KEY=$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 40)
        fi

        # 4. Reemplazar las claves temporales en el archivo .env
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # Compatibilidad para macOS
            sed -i '' "s/N8N_ENCRYPTION_KEY=.*/N8N_ENCRYPTION_KEY=$SECURE_KEY/g" "$ENV_FILE"
            sed -i '' "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$DB_PASS/g" "$ENV_FILE"
            sed -i '' "s/N8N_API_KEY=.*/N8N_API_KEY=$API_KEY/g" "$ENV_FILE"
        else
            # Linux estándar
            sed -i "s/N8N_ENCRYPTION_KEY=.*/N8N_ENCRYPTION_KEY=$SECURE_KEY/g" "$ENV_FILE"
            sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$DB_PASS/g" "$ENV_FILE"
            sed -i "s/N8N_API_KEY=.*/N8N_API_KEY=$API_KEY/g" "$ENV_FILE"
        fi

        echo "✅ Archivo .env generado exitosamente con claves seguras únicas."
    else
        echo "❌ Error: No se encontró el archivo $ENV_EXAMPLE. Asegúrate de que el repositorio esté completo."
        exit 1
    fi
fi

# 5. Preparar directorio para PostgreSQL
echo "📦 Preparando directorio de PostgreSQL..."
mkdir -p "$PROJECT_ROOT/postgres_data"
# Postgres usa internamente el usuario postgres.
# Dejaremos que Docker asigne los permisos correctos al iniciar, 
# pero nos aseguramos de que la carpeta exista para evitar conflictos de montaje.

echo "============================================="
echo "Próximos pasos:"
echo "1. Ejecuta 'nano .env' para configurar tu GROQ_API_KEY y TELEGRAM_BOT_TOKEN."
echo "2. Levanta los contenedores con 'docker compose up -d'."
echo "============================================="
