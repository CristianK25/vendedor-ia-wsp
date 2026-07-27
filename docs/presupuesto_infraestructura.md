# Presupuesto y Costos de Infraestructura (VPS)

Este documento detalla el análisis de requerimientos para el alojamiento del proyecto `vendedor-ia-n8n` y la estructura de costos del servidor VPS seleccionado.

## Análisis de Requerimientos

Basado en la arquitectura del proyecto (n8n, PostgreSQL, FastAPI, Frontend, Redis) y su uso esperado, estos son los requerimientos técnicos:

- **Tráfico Estimado:** ~50 usuarios diarios (tráfico bajo). n8n maneja esto sin problemas mediante webhooks.
- **Procesamiento de Inteligencia Artificial:** El sistema se comunica con APIs externas (ej. OpenAI, Anthropic, Meta). Al no procesar IA de forma local, **no se requiere GPU** ni procesadores de altísimo rendimiento.
- **Almacenamiento:** Solo texto en base de datos y archivos de imágenes comprimidos en formato `.webp` (muy livianos). Entre 20 GB y 40 GB de disco son más que suficientes para años de operación.
- **Memoria RAM:** El ecosistema de contenedores Docker consume aproximadamente ~850 MB de RAM en estado de reposo (idle). Durante picos de ejecución de flujos, puede subir a 1.5 GB. 
  - *Mínimo requerido:* 2 GB.
  - *Recomendado:* 4 GB a 8 GB para asegurar estabilidad total a largo plazo (evitar errores de "Out of Memory").

---

## Proveedor Seleccionado: Hostinger (Plan KVM 2)

Se ha elegido Hostinger por su confiabilidad, facilidad de uso y excelente relación precio/recursos en sus planes KVM. Este plan otorga acceso total (`root`) por SSH, lo que permite replicar el entorno local (instalar Docker, clonar el repositorio y ejecutar `docker-compose.yml`).

### Recursos del Servidor (KVM 2)
- **Procesadores:** 2 vCPU cores
- **Memoria RAM:** 8 GB
- **Almacenamiento:** 100 GB NVMe Disk Space

### Estructura de Precios y Facturación

El modelo de precios de Hostinger (al igual que el de muchos proveedores de hosting) está basado en descuentos por pagos adelantados:

1. **Precio Promocional por Adelantado:** **$8.79 USD / mes**.
   - Para acceder a este precio, es necesario contratar el servicio por un largo periodo (ej. 1, 2 o 4 años) y **pagar todo el plazo por adelantado en un solo pago** el día de hoy. Por ejemplo, por 2 años, el pago inicial rondaría los ~$210 USD. Durante ese tiempo, el servidor ya está cubierto.
2. **Precio de Renovación:** **$14.99 USD / mes**.
   - Una vez que se termine el periodo inicial promocional (ej. a los 2 años), la renovación automática se cobrará a este precio (si se elige renovar por 2 años más). Este será tu costo real a futuro.
3. **Precio Mensual (Sin Contrato):** **~$24.49 USD / mes**.
   - Este es el precio que cobraría Hostinger si decidís pagar de a un mes por vez (facturación mensual), sin atarte a un contrato largo. No conviene económicamente.

## Costos de Inteligencia Artificial (API de OpenAI)

El sistema de IA se cobra por "Token" (pedacitos de palabras). Para este proyecto utilizaremos el modelo **GPT-4o-mini**, que es el estándar actual de la industria para bots de venta por ser extremadamente capaz y muy económico.

### Precios base (GPT-4o-mini):
- **Input (Contexto enviado a la IA):** $0.15 USD por cada 1 Millón de tokens.
- **Output (Texto generado por la IA):** $0.60 USD por cada 1 Millón de tokens.

### Cálculo de Gasto Estimado
Basándonos en la configuración actual del proyecto:
1. **System Prompt:** El archivo `sistem_prompt.txt` (y las tools) pesan aprox. 3.5 KB, lo que se traduce en unos **1.000 tokens fijos**.
2. **Historial (Chat Memory):** Se recomienda subir la ventana de contexto de 5 a **15 o 20 mensajes** para que el bot no pierda el hilo. Las charlas cortas promediarán unos **500 tokens extra**.
3. **Volumen:** 50 clientes diarios, con un promedio de 10 idas y vueltas por charla (500 respuestas de IA al día).

**Costo por una (1) respuesta del bot:**
- 1.550 tokens de Input = $0.00023 USD
- 100 tokens de Output (respuesta corta) = $0.00006 USD
- **Total por mensaje:** ~$0.00029 USD

**Gasto Total:**
- **Gasto Diario:** 500 respuestas x $0.00029 = **$0.14 USD / día**
- **Gasto Mensual Estimado:** $0.14 x 30 días = **~$4.20 USD / mes**

Como se puede observar, el gasto mensual en IA será insignificante en relación al valor que aporta el bot.

---

## Costos de Meta (WhatsApp Cloud API)

WhatsApp no cobra por la cantidad de mensajes enviados, sino por **Conversaciones (ventanas de 24 horas)**. Existen dos reglas principales que aplican a los avisos de citas (confirmación o reprogramación):

### 1. Ventana de 24 horas (Conversaciones de Servicio - ¡Gratis!)
Si el cliente chatea con el bot pidiendo una cita, se abre una ventana de 24 horas. Si el Admin acepta la cita y el bot le manda el mensaje de confirmación **antes de que se cumplan esas 24 horas**, el mensaje entra como respuesta de servicio.
- **Costo:** **$0.00 USD (Gratis)**. Meta te regala 1.000 de estas conversaciones al mes. (Recién a partir del cliente número 1.001 te empiezan a cobrar ~$0.03 por conversación).

### 2. Mensajes Iniciados por la Empresa (Conversaciones de Utilidad - Plantillas)
Si el Admin tarda más de 24 horas en confirmar la cita, la ventana gratuita se cierra. Para contactar al cliente nuevamente (o para enviarle un link de reprogramación días después), debés usar una **Plantilla pre-aprobada por Meta** (Template Message). A esto se le llama "Conversación de Utilidad" (Utility Conversation).
- **Costo (en Argentina):** **~$0.035 USD** por cada conversación que inicies.
- Al pagar esos ~3 centavos, se vuelve a abrir una ventana de 24 horas donde el cliente puede responder y charlar gratis.

### Cálculo de Gasto Estimado (Meta)
Si asumimos el peor escenario donde a los 50 clientes diarios hay que mandarles la confirmación/reprogramación fuera de la ventana de 24 horas usando Plantillas de Utilidad:
- **Gasto Diario:** 50 clientes x $0.035 USD = **$1.75 USD / día**
- **Gasto Mensual:** $1.75 x 30 días = **~$52.50 USD / mes**

*Nota:* En la realidad, el gasto será muchísimo menor porque la gran mayoría de las confirmaciones de citas ocurren en el mismo día, entrando en la cuota de las 1.000 conversaciones gratuitas mensuales.

---

## Aclaración sobre el Manejo de Caídas (Docker vs PM2)

No es necesario instalar `pm2` para gestionar el funcionamiento o levantar el sistema si se cae. Dado que el proyecto está contenerizado, **Docker** se encarga de esto nativamente. 
En el archivo `docker-compose.yml`, todos los servicios tienen la instrucción `restart: unless-stopped`. Esto significa que si el VPS se reinicia, o si n8n / FastAPI sufren un crasheo inesperado, el motor de Docker los levantará automáticamente en cuestión de segundos.
