---
trigger: when finishing a ticket, task, block of work, or when the user requests a commit message.
---

# 📝 Reglas para Sugerencia de Commits

**Contexto:** El usuario tiene prohibido que el asistente realice `git commit`, `git add` o `git push` automáticamente. La gestión de Git es responsabilidad exclusiva del usuario.
**Objetivo:** Facilitar al usuario la creación del commit mediante sugerencias profesionales y limpias en el formato exacto requerido.

## 1. Regla de Oro
Al completar cualquier bloque de trabajo, cambio relevante, o ticket, **siempre** debes proveer la sugerencia del commit en la respuesta final de forma visible.

## 2. Estructura Obligatoria de Dos Partes
La sugerencia de commit debe dividirse de forma estricta y clara en dos partes bien identificables:

### Parte 1: Comando
El comando Git completo listo para ser ejecutado en la terminal.
Ejemplo:
```bash
git commit -m "feat(vehiculos): habilitar modificacion de tipo de alta en edicion"
```

### Parte 2: Mensaje
Únicamente el texto del mensaje (el contenido de la opción `-m`), sin comillas extras, limpio y listo para ser copiado y pegado en interfaces gráficas de control de versiones (como la extensión de Git de VS Code).
Ejemplo:
`feat(vehiculos): habilitar modificacion de tipo de alta en edicion`

## 3. Estándares del Mensaje
* Utilizar la convención de **Conventional Commits** (ej: `feat(...)`, `fix(...)`, `docs(...)`, `chore(...)`).
* Redactar en minúsculas y de forma concisa pero descriptiva.
* Evitar el uso de emojis en los commits.
