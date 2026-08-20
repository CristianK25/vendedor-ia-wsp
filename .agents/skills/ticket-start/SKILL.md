---
name: ticket-start
description: >-
  Use this skill when the user explicitly triggers '/ticket-start', 'start ticket', 'empezar ticket',
  or requests to initialize a new block of work or task from the checklist.
---

# Procedimiento de Inicio de Tareas (ticket-start)

Este procedimiento ayuda al agente a estructurar de manera uniforme la fase de investigación y planificación para cualquier nuevo bloque de trabajo.

## Pasos a seguir por el Agente

### 1. Identificar el Siguiente Bloque Pendiente
* Leer el archivo de control `_tickets/_bloques.md`.
* Buscar el primer bloque que no esté completado (que tenga `[ ]` en la lista).
* Si el archivo del ticket de ese bloque ya existe en `_tickets/`, leerlo.
* Si el archivo no existe, pídele al usuario los requerimientos o créalo basándote en la información que proporcione.

### 2. Crear el Plan de Implementación
* Analizar la base de código relevante (modelos, vistas, servicios) y dependencias.
* Crear un documento de plan de implementación en la ruta de artefactos (`implementation_plan.md`) con las secciones:
  * **Objetivo / Goal Description**
  * **Cambios Propuestos (Proposed Changes)** ordenados por componente/módulo.
  * **Plan de Verificación (Verification Plan)** con pruebas manuales y automatizadas.
  * **Preguntas Abiertas (Open Questions)** si hay dudas o alternativas de diseño.
* Configurar `RequestFeedback: true` en el metadata del artefacto para solicitar la aprobación del usuario antes de escribir código.

### 3. Crear la Lista de Tareas (Task List)
* Preparar el esqueleto del archivo `task.md` con los pasos detallados de desarrollo (backend, frontend, testing) estructurados como checklist.
* Este checklist se mantendrá en `[ ]` y se irá actualizando a medida que avance el desarrollo.

### 4. Presentar el Plan al Usuario
* Presentar un resumen breve en el chat del plan propuesto, indicando que el artefacto `implementation_plan.md` está listo para su revisión y aprobación.
* **No escribir código ni aplicar cambios** hasta que el usuario apruebe explícitamente el plan.
