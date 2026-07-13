# 🚀 Guía de Transición a Producción

Este documento detalla todos los cambios y configuraciones que debes realizar al desplegar la infraestructura y el flujo de n8n para un cliente real en producción.

---

## 🛠️ 1. Cambios en la Infraestructura (Docker & VPS)

### A. Eliminar el túnel temporal
En desarrollo usamos el parámetro `--tunnel` para obtener una URL de pruebas rápidamente. En producción esto debe eliminarse porque las URLs temporales cambian al reiniciar el contenedor y no son aptas para producción.
*   **Acción:** En `docker-compose.yml`, elimina la línea `command: start --tunnel` (o coméntala). Al hacerlo, n8n utilizará su comando de inicio por defecto de manera estable.

### B. Configurar SSL y Dominio (Requisito para WhatsApp)
La API de WhatsApp Cloud exige obligatoriamente que tu webhook utilice HTTPS con un certificado SSL válido.
*   **Acción:** 
    1. Compra o apunta un subdominio para el cliente (ej. `n8n.cliente.com`) hacia la IP de la VPS.
    2. Instala un proxy inverso (como **Nginx**, **Caddy** o **Traefik**) para manejar los certificados SSL (ej. con Let's Encrypt) y redirigir el tráfico del puerto `80/443` al puerto interno `5678` de n8n.

### C. Configurar Variables de Entorno de URL en el `.env`
n8n necesita saber cuál es su URL pública para estructurar correctamente los endpoints de los Webhooks.
*   **Acción:** Añade estas variables al archivo `.env` en producción:
    ```env
    # Cambia esto por el dominio real HTTPS del cliente
    N8N_HOST=n8n.cliente.com
    N8N_PORT=5678
    N8N_PROTOCOL=https
    WEBHOOK_URL=https://n8n.cliente.com/
    ```

### D. Seguridad de Encriptación
*   **Acción:** Genera una clave única y compleja para `N8N_ENCRYPTION_KEY` por cada cliente. No reutilices claves entre clientes. Puedes usar un generador de contraseñas o el comando `openssl rand -hex 32` en la terminal para crearla.

---

## 🤖 2. Cambios en el Flujo de n8n (`flujo.json`)

Para pasar del entorno de pruebas (Telegram) al entorno productivo (WhatsApp Cloud API), deberás realizar los siguientes cambios dentro del editor de n8n:

### A. Reemplazar los nodos de comunicación
1.  **Entrada:** Elimina el nodo **Telegram Trigger** y añade un nodo **Webhook**.
    *   **Método:** `POST`
    *   **Path:** `webhook-whatsapp`
2.  **Salida:** Elimina el nodo **Telegram (Send)** y añade un nodo **HTTP Request** (o el nodo nativo de WhatsApp de n8n) para hacer la llamada a la API de WhatsApp de Meta y enviar el texto de vuelta al cliente.

### B. Modificar la consulta del ID de Sesión (Memoria)
En Telegram usamos la ID del chat, pero en WhatsApp debemos capturar el número de teléfono del cliente que nos escribe.
*   **Acción:** En el nodo **Window Buffer Memory**, cambia la expresión del **Session ID**:
    *   *De (Telegram):* `={{ $('Telegram Trigger').item.json.message.chat.id }}`
    *   *A (WhatsApp):* `={{ $json.body.entry[0].changes[0].value.messages[0].from }}` (Esta ruta puede variar ligeramente según la estructura exacta del JSON que envía Meta).

### C. Modificar el ID en el registro de pedidos (Herramientas IA)
Si en tu base de datos SQLite registras quién hizo el pedido:
*   **Acción:** En la herramienta de **Crear Pedido**, asegúrate de reemplazar la referencia al ID de Telegram por el número de WhatsApp correspondiente (`from` del JSON de entrada).

---

## 🔒 3. Seguridad y Mantenimiento

*   **Webhook de Validación (Meta):** Cuando configures WhatsApp en la consola de Meta Developers, te pedirán ingresar una URL de Webhook y un "Verify Token" (un string que tú inventas). Debes configurar el nodo Webhook de entrada en n8n para que cuando reciba una petición `GET` de verificación, devuelva el parámetro `hub.challenge` que envía Meta.
*   **Backups:** Configura un cronjob en la VPS para que haga copias de seguridad diarias de la carpeta `./n8n_data`. Al ser una base de datos SQLite, basta con pausar el contenedor un segundo y copiar el archivo `.sqlite` a un almacenamiento externo seguro.
