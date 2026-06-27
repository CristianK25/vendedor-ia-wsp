# 🤖 Agente de Ventas IA por WhatsApp (MVP)

Este repositorio contiene la infraestructura y los flujos automatizados para desplegar un Agente de Ventas Inteligente por WhatsApp. El sistema no es un simple chatbot conversacional; utiliza Inteligencia Artificial Avanzada (Function Calling) para consultar inventarios en tiempo real, agendar citas en calendarios empresariales y confirmar pedidos, todo de manera autónoma.

## 💼 Modelo de Negocio y Arquitectura

El modelo de distribución de este software es **Single-Tenant (B2B)**.

- **VPS Dedicada:** El sistema se despliega en una VPS dedicada pagada por el cliente (ej. un servidor Ubuntu con procesador i3 y bajos recursos).
- **Privacidad:** Se garantiza el aislamiento de datos y la privacidad corporativa.
- **Sin Costos Centrales:** No hay costos de infraestructura centralizados para el proveedor del software.
- **Dockerizado:** Toda la aplicación se empaqueta y ejecuta dentro de Docker, permitiendo una replicación exacta y rápida por cada nuevo cliente.

## ⚙️ Reglas de Negocio (Core Features)

El flujo de n8n actúa como cerebro y orquestador, aplicando las siguientes reglas:

- **Atención al Cliente (Entrada/Salida):** Recibe mensajes a través de Telegram (entorno de Pruebas/Desarrollo) y la API oficial de WhatsApp Cloud (Producción). Un nodo de **Memoria Persistente (ej. SQLite Chat Memory)** mantiene el contexto de la conversación. Es crítico que el *Session ID* esté mapeado dinámicamente al identificador del usuario (teléfono o ID de Telegram) para aislar las sesiones.
- **Consulta de Stock (Herramienta Inteligente):** Antes de confirmar una venta, la IA utiliza una integración local (SQLite) para verificar la disponibilidad del producto solicitado.
- **Gestión de Calendario (Herramienta Inteligente):** Si el cliente requiere una reunión, entrega o servicio, la IA extrae la fecha, hora y correo del usuario, agendando un evento en Google Calendar que se asigna tanto a la empresa como al cliente.
- **Confirmación de Pedidos (Herramienta Inteligente):** Al cerrar la venta, el sistema actualiza el registro de base de datos de manera autónoma, sin requerir comandos de texto rígidos por parte del usuario.

## 🛠️ Stack Tecnológico

- **Motor de Automatización:** n8n (Self-hosted)
- **Contenedores:** Docker & Docker Compose
- **Base de Datos (Estado y Memoria):** SQLite (Integrado en el volumen de n8n)
- **Modelos LLM:** Anthropic (Sonnet/Opus 4.6 Thinking) u OpenAI, conectados vía API.
- **Integraciones Nativas:** Telegram (Desarrollo), WhatsApp Cloud API (Producción), Google Workspace (Calendar) y SQLite local.

## 📂 Estructura del Repositorio

```plaintext
/
├── docker-compose.yml     # Orquestación del contenedor de n8n
├── .env.example           # Plantilla de variables de entorno
├── README.md              # Documentación principal
├── docs/                  # Documentación auxiliar y guías
│   └── PRODUCCION.md      # Guía de transición a producción
├── workflows/             # Archivos de flujos de n8n (JSON)
│   └── flujo.json         # El código fuente del flujo exportado desde n8n
└── scripts/               # Scripts de inicialización y utilidades
    ├── setup.sh           # Generación de entorno .env y claves
    ├── update.sh          # Script de automatización de despliegue y actualización
    └── comandos.txt       # Referencia de comandos manuales
```

## 🚀 Guía de Despliegue Rápido (Nueva VPS)

Para instalar este sistema en el servidor de un nuevo cliente, ejecuta los siguientes pasos por SSH:

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO> /opt/whatsapp-ai-agent
   cd /opt/whatsapp-ai-agent
   ```

2. **Configurar variables de entorno:**
   Copia el archivo de ejemplo y completa los datos específicos del cliente.
   ```bash
   cp .env.example .env
   nano .env
   ```
   *(Asegúrate de configurar el dominio, los tokens de WhatsApp y las credenciales del LLM).*

3. **Levantar la infraestructura:**
   ```bash
   docker compose up -d
   ```

4. **Inyectar y activar el flujo de negocio:**
   Ejecuta el script de instalación para que n8n absorba el JSON del repositorio.
   ```bash
   chmod +x scripts/update.sh
   ./scripts/update.sh
   ```

## 🔄 Mantenimiento y Actualizaciones

Fieles al principio de pragmatismo y velocidad para un MVP, las actualizaciones de todos los clientes se manejan conectándose por SSH a cada VPS y ejecutando el script de actualización.

El archivo `scripts/update.sh` automatiza todo el proceso:
- Obtiene los últimos cambios del repositorio (`git pull`).
- Reinicia los contenedores si hubo cambios en la infraestructura.
- Sobrescribe el flujo en la base de datos de n8n utilizando su CLI nativa.
- Asegura que el flujo quede en estado Activo.

**Uso:**
```bash
cd /opt/whatsapp-ai-agent
./scripts/update.sh
```

## 📈 Roadmap y Escalabilidad Futura (Patrón Estrangulador)

La arquitectura modular en n8n permite que este MVP evolucione sin interrumpir el servicio. A medida que el volumen de clientes o la complejidad de las reglas de negocio aumenten:

- **Migración de Datos:** Se reemplazará Google Sheets por un contenedor PostgreSQL local en el mismo `docker-compose`.
- **Delegación Lógica (Microservicios):** Los nodos de herramientas de n8n pasarán a ejecutar peticiones HTTP hacia una API propia desarrollada en Python (FastAPI), trasladando la carga de procesamiento fuera de n8n y manteniendo el control absoluto sobre el código y los LLM.