#!/bin/bash

# Este script debe ejecutarse en el VPS (ej. a través de crontab)
# Asegúrate de estar en el directorio del proyecto antes de llamarlo o ajusta los paths.

# Directorio base del proyecto (ajustar si es necesario en el VPS)
PROJECT_DIR="/root/crm-autolead"
BACKUP_DIR="${PROJECT_DIR}/backups"
ENV_FILE="${PROJECT_DIR}/.env"

# Cargar variables de entorno (ignorar comentarios)
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' $ENV_FILE | xargs)
fi

# Variables por defecto por si no están en el .env
DB_USER=${POSTGRES_USER:-n8n}
DB_NAME=${POSTGRES_DB:-vendedor_ia}

# Crear carpeta de backups si no existe
mkdir -p "$BACKUP_DIR"

# Nombre del archivo con fecha y hora
FECHA=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/db_backup_$FECHA.dump"

# 1. Ejecutar el backup usando el contenedor de db
docker exec postgres-vendedor-ia pg_dump -U "$DB_USER" "$DB_NAME" -F c > "$BACKUP_FILE"

# 2. Mantener solo las últimas 2 copias
cd "$BACKUP_DIR" || exit
ls -tp db_backup_*.dump | grep -v '/$' | tail -n +3 | xargs -I {} rm -- {} 2>/dev/null

echo "Backup completado: $BACKUP_FILE"
