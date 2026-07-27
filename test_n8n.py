import urllib.request
import urllib.error
import json
import sys

def test_webhook():
    # Probamos tanto localhost como 127.0.0.1 en el puerto 5678 de n8n
    urls = [
        "http://localhost:5678/webhook/notificar-peticion",
        "http://127.0.0.1:5678/webhook/notificar-peticion"
    ]
    
    payload = {
        "accion": "aceptada",
        "peticion_id": 999,
        "cliente_telefono": "2087025697",
        "cliente_nombre": "Cristian (Test Python Paralelo)",
        "vehiculo_modelo": "Toyota Corolla Test",
        "fecha_propuesta": "2026-08-01T10:00:00",
        "origen": "test_script"
    }

    data_bytes = json.dumps(payload).encode('utf-8')

    print("=== INICIANDO TEST PARALELO HACIA N8N (urllib estándar) ===")
    print(f"Payload a enviar: {json.dumps(payload, indent=2)}\n")

    for url in urls:
        print(f"--- Probando URL: {url} ---")
        try:
            # Prueba 1: Sin cabeceras de autenticación (Para cuando quites Header Auth en n8n)
            print("1. Enviando SIN autenticación...")
            req_no_auth = urllib.request.Request(url, data=data_bytes, headers={"Content-Type": "application/json"}, method="POST")
            try:
                with urllib.request.urlopen(req_no_auth, timeout=5) as resp:
                    print(f"   Resultado: [{resp.status}] -> {resp.read().decode('utf-8')}")
                    print("\n¡ÉXITO SIN AUTH! El webhook recibió la petición.")
                    return
            except urllib.error.HTTPError as e:
                print(f"   Resultado HTTP Error: [{e.code}] -> {e.read().decode('utf-8')}")
            
            # Prueba 2: Con cabecera X-API-KEY (Para comparar)
            print("2. Enviando CON cabecera X-API-KEY...")
            headers = {
                "Content-Type": "application/json",
                "X-API-KEY": "5bcdfebf6c2a1008d987c7b48e84f7246aa6c2dabdffcd03a424f039cb0df9cc"
            }
            req_auth = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
            try:
                with urllib.request.urlopen(req_auth, timeout=5) as resp:
                    print(f"   Resultado: [{resp.status}] -> {resp.read().decode('utf-8')}")
                    print("\n¡ÉXITO CON AUTH! El webhook recibió la petición.")
                    return
            except urllib.error.HTTPError as e:
                print(f"   Resultado HTTP Error: [{e.code}] -> {e.read().decode('utf-8')}")
            print("-" * 50)
                
        except Exception as e:
            print(f"   [!] Error de conexión: {e}")
            
    print("\nNinguna prueba devolvió 200 OK. Verifica la configuración en tu pantalla de n8n.")

if __name__ == "__main__":
    test_webhook()
