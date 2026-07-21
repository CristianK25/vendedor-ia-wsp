import requests
from app.Core.config import settings

class PeticionService:
    @staticmethod
    def notificar_n8n(peticion_id: int, cliente_telefono: str, cliente_nombre: str, vehiculo_modelo: str, fecha_propuesta: str, accion: str, token_confirmacion: str = None):
        """
        Notifica a N8N que el administrador tomó una acción (aceptar o posponer).
        accion puede ser: 'aceptada' o 'pospuesta'
        """
        payload = {
            "peticion_id": peticion_id,
            "accion": accion,
            "cliente_telefono": cliente_telefono,
            "cliente_nombre": cliente_nombre,
            "vehiculo_modelo": vehiculo_modelo,
            "fecha_propuesta": fecha_propuesta,
            "token_confirmacion": token_confirmacion,
        }
        
        try:
            # Usamos timeout de 10 seg por seguridad en caso de que n8n esté lento
            response = requests.post(settings.N8N_WEBHOOK_URL, json=payload, timeout=10.0)
            response.raise_for_status()
            print(f"Notificado a n8n: {accion} para petición {peticion_id}")
        except Exception as e:
            # Lo ideal sería loggearlo, pero por ahora imprimimos para debug
            print(f"Error al notificar a n8n el cambio de estado de petición {peticion_id}: {e}")
