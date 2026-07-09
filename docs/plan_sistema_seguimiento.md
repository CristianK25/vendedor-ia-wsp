# Plan de Reestructuración: Motor de Seguimiento y Retargeting

Este documento contiene la propuesta para reorganizar la base de datos, los flujos de n8n, y la lógica del Agente de Ventas, con el objetivo de hacer el sistema más escalable, fácil de leer y efectivo para manejar el contexto de las respuestas de los clientes.

---

## 1. Reestructuración de la Base de Datos

Actualmente, el envío de mensajes se basa en deducir fechas al vuelo desde la tabla `interacciones`. Esto hace que las consultas SQL sean complejas y que no haya un registro claro de *qué* se va a enviar y *cuándo*.

### Propuesta: Tabla de `mensajes_programados` (Cola de Mensajes)
En lugar de calcular todo en el momento, el sistema insertará tareas en una cola cuando ocurra un evento clave (por ejemplo, al registrar una compra).

* **Tabla `mensajes_programados`**
  * `id`: Identificador único.
  * `telefono_cliente`: Referencia al cliente.
  * `tipo_mensaje`: `RECORDATORIO_PAGO`, `CALIDAD_RESEÑA`, `CROSS_SELLING`, `SALUDO_FESTIVO`.
  * `fecha_programada`: Cuándo debe enviarse (ej. `NOW() + 3 days` para reseñas).
  * `estado`: `PENDIENTE`, `ENVIADO`, `RESPONDIDO`, `CANCELADO`.
  * `contexto_json`: Información extra necesaria para el IA Redactor (ej. `{"producto_id": 123, "nombre_producto": "Zapatillas", "categoria": "Calzado"}`).

### Propuesta: Control de Contexto en el Cliente
Para resolver el problema de que el Agente de Ventas no sepa de qué está hablando el cliente cuando responde a un mensaje proactivo, necesitamos guardar el "estado de la conversación".

* **Nuevos campos en la tabla `clientes`:**
  * `estado_conversacion`: Puede ser `NORMAL`, `ESPERANDO_RESEÑA`, `ESPERANDO_PAGO`.
  * `id_mensaje_esperado`: El ID del mensaje programado al que se espera que el cliente responda.

---

## 2. Reestructuración de los Flujos de n8n

Tener todos los redactores y la lógica en un solo workflow (como está actualmente) lo vuelve difícil de mantener y visualizar. La mejor práctica en n8n es usar un **Patrón Dispatcher-Worker** (Un flujo coordinador y múltiples sub-flujos especializados).

### Flujo 1: Dispatcher de Seguimiento (El único con Cron)
Este flujo se ejecuta todos los días a las 11:00 AM.
1. **Acción:** Consulta la BD: `SELECT * FROM mensajes_programados WHERE estado = 'PENDIENTE' AND fecha_programada <= NOW()`.
2. **Bucle (Loop):** Pasa por cada mensaje pendiente.
3. **Switch:** Dependiendo del `tipo_mensaje`, envía los datos a un sub-flujo usando el nodo **Execute Workflow**.
4. **Post-Acción:** 
   * Marca el mensaje como `ENVIADO`.
   * Si el mensaje espera una respuesta (como las reseñas), actualiza el cliente: `UPDATE clientes SET estado_conversacion = 'ESPERANDO_RESEÑA' WHERE telefono = ...`

### Flujos "Workers" (Sub-flujos, uno por cada tipo)
Estos flujos no tienen cron ni triggers directos. Solo se activan cuando el Dispatcher los llama. Son pequeños, limpios y fáciles de editar.

* **Sub-flujo A: Calidad y Reseñas:**
  * Recibe el `contexto_json`.
  * IA Redactor crea un mensaje preguntando qué le pareció el producto.
  * Envía el mensaje por WhatsApp/Telegram.
* **Sub-flujo B: Cross-Selling:**
  * IA Redactor revisa la categoría del producto comprado hace 15/30 días y sugiere algo nuevo sutilmente.
* **Sub-flujo C: Recordatorios de Pago:**
  * Mensaje amable recordando la falta de confirmación de pago.
* **Sub-flujo D: Saludos Festivos:**
  * Felicitaciones en fechas especiales (este podría alimentarse de otra tabla de campañas o directamente de la base de datos).

---

## 3. Solución al Problema del Agente de Ventas (Recepción de Mensajes)

Cuando el cliente responda "Todo excelente, me encantaron las zapatillas", el flujo de recepción (Webhooks de WhatsApp) actuará de la siguiente manera:

1. **Paso 1:** Llega el mensaje. El flujo consulta la tabla `clientes` para ver quién es.
2. **Paso 2:** Revisa el campo `estado_conversacion`.
3. **Router (Switch):**
   * **Caso `ESPERANDO_RESEÑA`:** El mensaje se desvía a un flujo especializado en procesar reseñas. 
     * *Acción:* La IA extrae el sentimiento, guarda la reseña en la base de datos.
     * *Acción:* La IA redacta un agradecimiento corto ("¡Qué bueno saberlo! Gracias por tu opinión.").
     * *Cierre:* `UPDATE clientes SET estado_conversacion = 'NORMAL'` (Para que el próximo mensaje vaya al agente de ventas normal).
   * **Caso `ESPERANDO_PAGO`:** Se desvía al flujo de pagos para verificar comprobantes.
   * **Caso `NORMAL` (o NULL):** El mensaje fluye hacia el Agente de Ventas tradicional para responder dudas generales, consultas de catálogo, etc.

---

## Resumen de Beneficios de este Plan

1. **Legibilidad:** En la base de datos, bastará un simple `SELECT` para saber a quiénes se les va a hablar hoy y de qué tema.
2. **Mantenibilidad en n8n:** Si quieres añadir un nuevo tipo de campaña (ej. "Sorteo para clientes antiguos"), solo creas un nuevo Sub-flujo y agregas el tipo de mensaje a la base de datos, sin tocar el Agente de Ventas ni el Dispatcher principal.
3. **Coherencia Conversacional:** Al guardar el estado (`ESPERANDO_RESEÑA`), la IA no se confundirá y sabrá exactamente cómo procesar la respuesta del cliente, guardándola estructuradamente como una reseña real en la BD.
