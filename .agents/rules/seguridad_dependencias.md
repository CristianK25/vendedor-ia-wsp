# 🛡️ Reglas de Seguridad para Dependencias (NPM / PNPM)

Este documento define la política estricta para la gestión de dependencias de Node.js en este proyecto. Todo agente de IA y desarrollador debe seguir estas directrices al modificar, agregar o auditar paquetes de JavaScript.

---

## 1. 📌 Versiones Fijas y Bloqueadas (Pinned Versions)
* **Regla:** **PROHIBIDO** el uso de rangos dinámicos (`^` o `~`) en el archivo `package.json`.
* **Acción:** Todas las dependencias añadidas o modificadas deben especificar su versión exacta (ej. `"react": "19.2.7"`, no `"react": "^19.2.7"`).
* **Razón:** Esto previene ataques de la cadena de suministro en los que una sub-dependencia se actualiza automáticamente con código comprometido en una nueva compilación.

---

## 2. 🔍 Auditoría Obligatoria de Vulnerabilidades
* **Regla:** Antes de proponer o aplicar cambios en las dependencias, se debe verificar el estado de vulnerabilidades conocidas.
* **Acción:** 
  1. Al agregar un paquete, se debe recomendar o ejecutar `pnpm audit` (o `npm audit` según corresponda) para verificar la existencia de CVEs en el árbol de dependencias.
  2. Si se detectan vulnerabilidades críticas, se debe buscar una alternativa segura o actualizar a la versión parcheada de inmediato.

---

## 3. 🚦 Control de Reputación y Scripts de Instalación
* **Regla:** Minimizar la exposición a paquetes maliciosos y bloquear la ejecución de código arbitrario.
* **Acción:**
  1. **Evitar paquetes sospechosos:** Validar la reputación de paquetes nuevos (usar Socket.dev, Snyk o verificar descargas/madurez). No sugerir librerías obscuras, duplicadas o recién creadas si existen alternativas consolidadas.
  2. **Bloqueo Global (`ignore-scripts`):** En este entorno, los scripts de post-instalación de paquetes están bloqueados globalmente. Si una librería legítima (ej. `esbuild`, `oxlint`, `sharp`) requiere compilación, se debe añadir explícitamente a `pnpm.onlyBuiltDependencies` dentro del `package.json` en lugar de desactivar el bloqueo global.
