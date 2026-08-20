---
name: ticket-done
description: >-
  Use this skill when the user explicitly triggers '/ticket-done', '/finish-task', '/changelog-git', 'finish task',
  or requests to close the current block, generate the changelog, and suggest the commit.
---

# Procedimiento de Cierre de Tareas (finish-task / changelog-git)

Este procedimiento automatiza las tareas repetitivas de finalización de bloques de trabajo en el proyecto AutoLead CRM.

## Pasos a seguir por el Agente

### 1. Identificar la Tarea/Bloque a Cerrar
* Buscar en el directorio `_tickets/` cualquier archivo `.md` (excepto `_bloques.md`) que represente la tarea activa actual.
* Si el usuario no especificó el número de bloque o nombre de la tarea, infiérelo basándote en los últimos cambios realizados o preguntale al usuario por el archivo del ticket si hay múltiples.

### 2. Generar y Registrar la Nota de Changelog
* Generar un UUID versión 4 aleatorio.
* Usar la fecha actual (YYYY-MM-DD).
* Analizar los cambios realizados en el código.
* Redactar la entrada en `frontend/public/changelog.json` cumpliendo estrictamente con:
  * **Sin emojis** ni jerga técnica.
  * Tono profesional e institucional.
  * `tipo_cambio` debe ser uno de: `"Nueva Función"`, `"Mejora Visual"`, o `"Corrección"`.
  * La descripción `detalles_md` debe contener Markdown formal con viñetas, negritas, y una tabla de capacidades añadidas/comportamiento del sistema.
* Insertar el objeto al inicio de la lista `"actualizaciones"` en `frontend/public/changelog.json` respetando el formato JSON exacto.

### 3. Actualizar Estados de Tickets
* Modificar el archivo `_tickets/_bloques.md` para marcar el bloque como completado:
  * Cambiar `[ ]` por `[x]`.
  * Modificar el enlace del archivo para que apunte a `_tickets/done/nombre_del_archivo.md`.
* Mover físicamente el archivo del ticket desde `_tickets/nombre_del_archivo.md` a `_tickets/done/nombre_del_archivo.md`.

### 4. Proveer Sugerencia de Commit en Dos Partes
* Al final de la interacción en el chat, mostrar al usuario la sugerencia de commit dividida en dos secciones obligatorias:
  1. **Parte 1: Comando** - El comando completo para la terminal. Ejemplo:
     ```bash
     git commit -m "feat(modulo): descripcion de la mejora"
     ```
  2. **Parte 2: Mensaje** - Únicamente el texto plano del mensaje para copiar rápidamente. Ejemplo:
     `feat(modulo): descripcion de la mejora`
