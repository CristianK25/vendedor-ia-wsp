from fastapi import APIRouter, status
from app.Modules.logs.schema import FrontendErrorPayload
from app.Modules.logs.service import LogsService

router = APIRouter(prefix="/logs", tags=["Logs"])

@router.post("/frontend", status_code=status.HTTP_200_OK)
def log_frontend_error(payload: FrontendErrorPayload):
    """
    Endpoint público para recibir reportes de errores y excepciones no controladas
    capturadas por el ErrorBoundary en el cliente frontend.
    """
    LogsService.record_frontend_error(payload)
    return {"status": "ok", "timestamp": LogsService.get_current_mendoza_time()}
