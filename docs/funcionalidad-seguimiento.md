# 🤖 Módulo de Retargeting Inteligente y Post-Venta (Estilo Mercado Libre)

Este módulo describe la arquitectura y lógica de negocio para la reactivación automatizada de clientes a través de WhatsApp, inspirada en los disparadores (triggers) de eventos de Mercado Libre. El objetivo principal es maximizar las conversiones y fidelizar al cliente sin incurrir en prácticas de spam, respetando la privacidad y el espacio del usuario.

> [!NOTE]
> **Aviso Importante:** Todos los fragmentos de código, consultas SQL y esquemas de tablas provistos en este documento son de carácter **sugerido/referencial** y pueden ser adaptados o modificados según las necesidades específicas de la implementación.

## 🧠 Filosofía del Sistema: Interacción Basada en Eventos

A diferencia de los bots tradicionales que envían campañas masivas genéricas, este sistema está orientado a eventos (*Event-Driven*). Cada mensaje proactivo enviado por el bot debe estar justificado por una acción previa del cliente y despachado en el momento de mayor impacto psicológico de compra.

```plaintext
[Interacción del Cliente] ──> (Se guarda Evento en BD) ──> [Cron Diario] ──> (Filtro SQL + IA) ──> [Mensaje WhatsApp Único]
```

## 🏗️ 1. Modelo de Datos Estandarizado (`negocio.sqlite`)

Para segmentar correctamente y evitar el spam, la base de datos SQLite unificada evoluciona para registrar el historial de acciones mediante tres tablas interconectadas:

```sql
-- 1. Tabla de Clientes: Registra el estado general y el candado de seguridad.
CREATE TABLE clientes (
    telefono TEXT PRIMARY KEY,
    nombre TEXT,
    ultimo_mensaje_bot DATETIME -- Evita saturar al cliente con mensajes proactivos seguidos.
);

-- 2. Tabla de Productos: Base para el análisis de categorías y alternativas.
CREATE TABLE productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    precio REAL NOT NULL
);

-- 3. Tabla de Interacciones: El motor del retargeting.
CREATE TABLE interacciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telefono TEXT,
    producto_id INTEGER,
    tipo_evento TEXT CHECK(tipo_evento IN ('CONSULTA', 'COMPRA')),
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    seguimiento_completado BOOLEAN DEFAULT 0, -- 0 = Pendiente, 1 = Procesado
    FOREIGN KEY (telefono) REFERENCES clientes(telefono),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);
```

## 🛠️ 2. Los 3 Disparadores de Negocio (Core Triggers)

El flujo se ejecuta de forma asíncrona una vez al día mediante un *Schedule Trigger* (Cron) en n8n (ej. todos los días a las 11:00 AM) y evalúa tres escenarios:

### A. Carrito Abandonado (T + 24 a 48 Horas)
- **Escenario:** El cliente consultó por un producto específico, el bot confirmó stock, pero la venta no se cerró.
- **Lógica SQL:** Selecciona interacciones de tipo `CONSULTA` con antigüedad de entre 24 y 48 horas, asegurándose de que ese número de teléfono no tenga un evento de `COMPRA` posterior.
- **Acción de la IA:** Redacta un mensaje casual e informal recordando el interés y ofreciendo sutilmente el catálogo o alternativas de la misma categoría.

### B. Control de Calidad Post-Venta (T + 3 Días)
- **Escenario:** El cliente finalizó una compra con éxito.
- **Lógica SQL:** Selecciona eventos de `COMPRA` cuya antigüedad sea exactamente de 3 días y tengan `seguimiento_completado = 0`.
- **Acción de la IA:** Genera un mensaje de servicio al cliente: *"Hola, quería saber si tu pedido llegó bien y qué te pareció la atención"*. Esto incrementa el engagement y abre la puerta a futuras ventas de forma orgánica.

### C. Cross-Selling / Recomendación Cruzada (T + 15 a 30 Días)
- **Escenario:** Cliente fidelizado que ya compró hace un tiempo.
- **Lógica SQL:** Filtra compras antiguas para ofrecer productos complementarios.
- **Acción de la IA:** Tomando como base el producto que compró, la IA busca artículos de categorías relacionadas y redacta una oferta exclusiva.

## 🔒 3. El Candado Anti-Spam (Regla de Oro)

Para garantizar la estabilidad de la cuenta de WhatsApp Business del cliente y evitar bloqueos por parte de Meta, todas las consultas SQL de retargeting están condicionadas por un doble filtro de seguridad:

- **Filtro de exclusión por interacción:** Si un usuario responde al seguimiento y comienza a chatear con el bot de ventas, el flujo de retargeting se pausa inmediatamente para ese usuario.
- **Candado de tiempo estricto:** La consulta SQL valida que la columna `ultimo_mensaje_bot` en la tabla `clientes` sea mayor a 7 días. Ningún mensaje de campaña proactiva saldrá de la VPS si el bot ya le inició una conversación al usuario en la última semana.

## 🎛️ 4. Estructura del Workflow en n8n

El desarrollo se concentra en un único workflow independiente estructurado en las siguientes capas de nodos:

- **Capa de Tiempo (Schedule Trigger):** Despierta el flujo en horarios de alto índice de lectura (10:00 AM - 12:00 PM).
- **Capa de Extracción (SQLite Node):** Ejecuta de forma secuencial o en paralelo las tres consultas de eventos (Consultas pendientes, Compras pendientes).
- **Capa de Razonamiento (AI Agent + Chat Model):** Recibe el payload del cliente (Nombre, Teléfono, Producto de interés, Tipo de evento). El *System Prompt* instruye a la IA a adoptar una postura de asesor de ventas empático y prohíbe textos corporativos o rígidos.
- **Capa de Despacho (HTTP Request / WhatsApp Node):** Envía el mensaje personalizado estructurado por el LLM.
- **Capa de Cierre (SQLite Node - Post-Ejecución):**
  - Actualiza `seguimiento_completado = 1` en la tabla `interacciones`.
  - Registra el `CURRENT_TIMESTAMP` en la columna `ultimo_mensaje_bot` del cliente para activar el candado de seguridad.

---

## ⚙️ Scripts de Consultas SQL de Referencia para los Nodos

> [!TIP]
> Las consultas presentadas abajo son sugerencias conceptuales para su uso en n8n.

### Query para Carrito Abandonado (Sugerido)
```sql
SELECT i.id AS interaccion_id, i.telefono, c.nombre, p.nombre AS producto_nombre, p.categoria
FROM interacciones i
JOIN productos p ON i.producto_id = p.id
JOIN clientes c ON i.telefono = c.telefono
WHERE i.tipo_evento = 'CONSULTA'
  AND i.fecha <= datetime('now', '-1 day')
  AND i.fecha >= datetime('now', '-2 days')
  AND i.seguimiento_completado = 0
  AND (c.ultimo_mensaje_bot IS NULL OR c.ultimo_mensaje_bot <= datetime('now', '-7 days'))
  AND NOT EXISTS (
      SELECT 1 FROM interacciones 
      WHERE telefono = i.telefono 
        AND tipo_evento = 'COMPRA' 
        AND fecha > i.fecha
  );
```

### Query para Post-Venta (Sugerido)
```sql
SELECT i.id AS interaccion_id, i.telefono, c.nombre, p.nombre AS producto_nombre
FROM interacciones i
JOIN productos p ON i.producto_id = p.id
JOIN clientes c ON i.telefono = c.telefono
WHERE i.tipo_evento = 'COMPRA'
  AND i.fecha <= datetime('now', '-3 days')
  AND i.fecha >= datetime('now', '-4 days')
  AND i.seguimiento_completado = 0;
```