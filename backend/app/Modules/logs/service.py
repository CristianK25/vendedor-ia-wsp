import os
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from app.Modules.logs.schema import FrontendErrorPayload

LOGS_DIR = os.environ.get("LOGS_DIR", "logs")
os.makedirs(LOGS_DIR, exist_ok=True)

FRONTEND_LOG_PATH = os.path.join(LOGS_DIR, "frontend_errors.log")

try:
    MENDOZA_TZ = ZoneInfo("America/Argentina/Mendoza")
except Exception:
    try:
        MENDOZA_TZ = ZoneInfo("America/Argentina/Buenos_Aires")
    except Exception:
        MENDOZA_TZ = timezone(timedelta(hours=-3))

# Configurar logger dedicado con rotación automática (Máximo 5MB por archivo, hasta 5 archivos de historial)
frontend_logger = logging.getLogger("frontend_errors")
frontend_logger.setLevel(logging.INFO)

# Evitar duplicar handlers si se recarga el módulo
if not frontend_logger.handlers:
    file_handler = RotatingFileHandler(
        FRONTEND_LOG_PATH,
        maxBytes=5 * 1024 * 1024,  # 5 MB
        backupCount=5,
        encoding="utf-8"
    )
    file_handler.setLevel(logging.INFO)
    # Formato simple para el archivo ya que agregamos el bloque formateado manualmente
    file_handler.setFormatter(logging.Formatter("%(message)s"))
    frontend_logger.addHandler(file_handler)


class LogsService:
    @staticmethod
    def get_current_mendoza_time() -> str:
        return datetime.now(MENDOZA_TZ).strftime("%Y-%m-%d %H:%M:%S ART")

    @classmethod
    def record_frontend_error(cls, payload: FrontendErrorPayload):
        timestamp = cls.get_current_mendoza_time()
        
        user_info = payload.user_email or "Anónimo / No autenticado"
        user_agent = payload.user_agent or "Desconocido"
        stack = payload.component_stack.strip() if payload.component_stack else "Sin Component Stack disponible"
        
        log_entry = (
            f"\n{'='*80}\n"
            f"[{timestamp}] REPORTE DE ERROR EN CLIENTE FRONTEND\n"
            f"Usuario: {user_info}\n"
            f"URL: {payload.url}\n"
            f"Navegador (UA): {user_agent}\n"
            f"Error: {payload.error_name}: {payload.error_message}\n"
            f"Component Stack:\n{stack}\n"
            f"{'='*80}"
        )
        
        # Guardar en archivo rotativo frontend_errors.log
        frontend_logger.info(log_entry)
        
        # También loguear una línea resumen a stdout para Docker logs
        logging.getLogger("uvicorn.error").error(
            f"[{timestamp}] [FRONTEND_ERROR] {user_info} | {payload.url} | {payload.error_name}: {payload.error_message}"
        )
