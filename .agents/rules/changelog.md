---
trigger: when dealing with changelogs, updates, releases, or when the user asks to generate the changelog.
---

# 📢 Reglas del Changelog (Actualizaciones para el Cliente)

**Contexto:** El usuario puede solicitar la generación de un Changelog ("Actualiza el changelog", "Genera el log de hoy") en base al trabajo técnico reciente.
**Objetivo:** Agrupar, traducir y redactar los cambios técnicos en notas de lanzamiento (Release Notes) extremadamente profesionales, formales y estructuradas, dirigidas al cliente final del CRM.

## 1. Flujo de Trabajo del Agente
1. **Recopilación:** Cuando se solicite actualizar el Changelog, el agente debe investigar el trabajo realizado hoy. Para ello, leerá los últimos archivos en `_tickets/done/` o ejecutará `git log --since="midnight"` para ver los commits.
2. **Abstracción:** Agrupar múltiples commits en características de negocio. (Ej: 10 commits modificando CSS y vistas se agrupan en un solo punto: "Mejoras en la interfaz gráfica de vehículos").
3. **Persistencia:** Todo el output se guardará añadiendo objetos JSON al archivo `frontend/public/changelog.json`.

## 2. Restricciones Estrictas de Formato y Redacción
* **Cero Emojis:** Está estrictamente prohibido el uso de emojis en los títulos y descripciones del Changelog. 
* **Tono Profesional:** Mantener un tono serio, corporativo y directo. Evitar lenguaje entusiasta exagerado.
* **Prohibición de Jerga Técnica:** Nunca mencionar herramientas de desarrollo (React, Docker, NPM, Commits, Refactors, Endpoints, Bases de datos).
* **Estructura Markdown Requerida:** La clave `descripcion` del JSON debe contener Markdown estructurado utilizando:
  * Encabezados (`###`, `####`)
  * Tablas (`| Columna | Columna |`) para comparar o listar características cuando sea apropiado.
  * Listas de viñetas (`- `) de forma limpia y concisa.
  * Texto en negrita para resaltar elementos clave de la interfaz de usuario.

## 3. Categorías Permitidas
Para mantener la compatibilidad con el frontend, el campo `tipo_cambio` dentro del JSON debe ser EXCLUSIVAMENTE uno de los siguientes valores exactos:
* `Nueva Función`
* `Mejora Visual`
* `Corrección`

## 4. Ejemplo de Estructura JSON y Markdown
```json
{
  "actualizaciones": [
    {
      "id": "UUID-generado-por-el-agente",
      "fecha": "YYYY-MM-DD",
      "tipo_cambio": "Nueva Función",
      "titulo": "Implementación del Módulo de Facturación",
      "resumen": "Resumen corto de una línea para la previsualización en la lista.",
      "detalles_md": "### Visión General\nSe ha incorporado un nuevo módulo que permite la gestión centralizada de transacciones comerciales.\n\n### Capacidades Añadidas\n| Característica | Descripción |\n|---|---|\n| **Registro Automático** | El sistema captura los montos finales tras la confirmación de la venta. |\n| **Reportes Históricos** | Acceso al listado de facturas emitidas por fecha y vendedor. |\n\n### Mejoras de Estabilidad\n- Optimización en los tiempos de carga del panel principal.\n- Se corrigió una interrupción en la visualización de imágenes de alta resolución en el legajo de vehículos."
    }
  ]
}
```
