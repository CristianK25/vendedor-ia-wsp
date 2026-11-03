import logging
import requests
from app.Core.config import settings

logger = logging.getLogger("peticiones.service")


class PeticionService:
    @staticmethod
    def notificar_n8n(
        peticion_id: int,
        cliente_telefono: str,
        cliente_nombre: str,
        vehiculo_modelo: str,
        fecha_propuesta: str,
        accion: str,
        token_confirmacion: str | None = None,
        fecha_formateada: str | None = None,
        mensaje_whatsapp: str | None = None,
    ) -> bool:
        """
        Notifica al workflow 'Enviar WSP' de n8n para que envíe el mensaje de WhatsApp
        al cliente directamente desde el número del Bot (WhatsApp Business Cloud API).
        accion puede ser: 'aceptada' o 'pospuesta'
        """
        telefono_limpio = "".join(c for c in (cliente_telefono or "") if c.isdigit())
        payload = {
            "peticion_id": peticion_id,
            "accion": accion,
            "cliente_telefono": telefono_limpio or cliente_telefono,
            "cliente_nombre": cliente_nombre,
            "vehiculo_modelo": vehiculo_modelo or "Consulta general",
            "fecha_propuesta": fecha_propuesta,
            "fecha_formateada": fecha_formateada,
            "mensaje_whatsapp": mensaje_whatsapp,
            "token_confirmacion": token_confirmacion,
        }

        try:
            url = f"{settings.N8N_WEBHOOK_BASE_URL}/notificar-peticion"
            response = requests.post(url, json=payload, timeout=10.0)
            response.raise_for_status()
            logger.info("Notificado a n8n (%s) para petición %s -> %s", accion, peticion_id, telefono_limpio)
            return True
        except Exception as e:
            logger.error("Error al notificar a n8n el cambio de estado de petición %s: %s", peticion_id, e)
            return False
