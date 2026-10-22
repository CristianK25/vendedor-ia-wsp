---
name: security-audit
description: >-
  Use this skill when the user triggers '/security-audit', '/audit-code', 'auditar seguridad',
  'revisar vulnerabilidades', or asks to audit the codebase for LFI, RCE, SAST (Bandit/Semgrep),
  dependency vulnerabilities (pip-audit/pnpm audit), or insecure configurations.
---

# Procedimiento de Auditoría de Seguridad de Código (security-audit)

Esta skill define el procedimiento estándar para auditar la base de código frente a vulnerabilidades críticas de desarrollo web y backend (especialmente **LFI / Path Traversal**, **RCE / Remote Code Execution**, inyecciones y dependencias vulnerables).

---

## 🛡️ Reglas y Filosofía de Auditoría

1. **Defensa en Profundidad:** No confiar en validaciones del frontend; auditar siempre la capa de backend, el sistema de archivos y la infraestructura (Docker / Nginx).
2. **Respeto a Políticas de Seguridad del Entorno:**
   * **Prohibido `npx`:** Para ejecutar herramientas Node temporales usar obligatoriamente `pnpm dlx` (ej: `pnpm dlx semgrep`).
   * **Scripts de post-instalación:** Respetar `ignore-scripts=true`. Si una herramienta requiere compilación, debe declararse en `pnpm.onlyBuiltDependencies`.
   * **Versiones fijas:** Todas las dependencias deben tener versiones fijas (sin `^` ni `~`).
3. **No ejecutar Git:** El agente jamás realiza `git add`, `git commit` ni `git push`. Al finalizar la auditoría o aplicar parches, solo sugerirá el commit profesional dividido en dos partes (Comando y Mensaje).

---

## 📋 Fases del Procedimiento de Auditoría

```
┌─────────────────────────────────────────────────────────────────┐
│ Fase 1: Rastreo de Sinks (LFI, RCE, SSRF, Deserialización)     │
├─────────────────────────────────────────────────────────────────┤
│ Fase 2: Análisis Estático Automatizado (SAST con Bandit/Semgrep) │
├─────────────────────────────────────────────────────────────────┤
│ Fase 3: Auditoría de Dependencias (SCA con pip-audit/pnpm)     │
├─────────────────────────────────────────────────────────────────┤
│ Fase 4: Revisión de Configuración (Docker, Nginx, Uploads)     │
├─────────────────────────────────────────────────────────────────┤
│ Fase 5: Reporte y Plan de Remediación                          │
└─────────────────────────────────────────────────────────────────┘
```

---

### Fase 1: Rastreo Manual de "Sinks" (Puntos Críticos de Inyección)

Un **Sink** es una función del lenguaje donde un dato no confiable puede interactuar con el sistema operativo, el disco o el intérprete.

#### 1.1. Búsqueda de Vectores LFI (Local File Inclusion / Path Traversal)
Buscar dónde se leen, abren o envían archivos al cliente:
```bash
# Python / FastAPI:
grep -rnE "(open\(|FileResponse|send_file|send_from_directory|StaticFiles|os\.path\.join)" backend/

# JavaScript / Node:
grep -rnE "(fs\.readFile|fs\.createReadStream|res\.sendFile|res\.download|path\.join)" frontend/
```
* **Criterio de Riesgo:** Si el nombre del archivo o ruta proviene de parámetros de consulta (`query`), variables de ruta (`path params`), o cabeceras del usuario sin sanitizar ni usar `os.path.basename()` / UUID.

#### 1.2. Búsqueda de Vectores RCE (Remote Code Execution)
Buscar llamadas a la terminal del sistema operativo, evaluación de código o deserialización:
```bash
# Ejecución de comandos del sistema operativo:
grep -rnE "(os\.system|os\.popen|subprocess\.|commands\.)" backend/

# Evaluación dinámica de código:
grep -rnE "(eval\(|exec\(|compile\(|__import__)" backend/

# Deserialización insegura de objetos:
grep -rnE "(pickle\.loads|pickle\.load|_pickle|yaml\.load\(|yaml\.unsafe_load)" backend/
```
* **Criterio de Riesgo:** Cualquier llamada a `subprocess` con `shell=True`, concatenación de variables de usuario en comandos bash, o uso de `eval()` / `pickle.loads()`.

---

### Fase 2: Análisis Estático de Código (SAST)

#### 2.1. Bandit (SAST especializado para Python)
Analiza el código Python contra debilidades comunes de seguridad:
```bash
# Activar entorno virtual si existe y ejecutar bandit
bandit -r backend/app/ -ll
```
* `-r`: Recursivo en el directorio del backend.
* `-ll`: Muestra hallazgos de severidad Media y Alta (ignora advertencias triviales de bajo impacto).
* **Parámetros adicionales útiles:**
  * `bandit -r backend/app/ -f json -o bandit_report.json` (reporte estructurado).

#### 2.2. Semgrep (SAST Multilenguaje)
Analiza código frontend y backend contra reglas OWASP:
```bash
# En el entorno local seguro (usando pnpm dlx, NUNCA npx):
pnpm dlx semgrep --config=auto
```

---

### Fase 3: Auditoría de Dependencias (SCA)

Detectar librerías instaladas con CVEs (vulnerabilidades conocidas) registradas en bases de datos públicas.

#### 3.1. Python (Backend)
```bash
# Usando pip-audit:
pip install pip-audit --quiet
pip-audit -r backend/requirements.txt
```

#### 3.2. Node.js (Frontend)
```bash
# En la carpeta frontend:
cd frontend && pnpm audit
```
* Si se encuentran vulnerabilidades críticas, revisar si existe una versión parcheada y actualizar el `package.json` **con versión fija (sin `^` ni `~`)**.

---

### Fase 4: Revisión de Hardening e Infraestructura

1. **Subida de Archivos (File Uploads):**
   * ¿El nombre físico del archivo se genera mediante `uuid.uuid4()` en el servidor? *(Requisito obligatorio)*.
   * ¿Se valida la extensión del archivo contra una lista blanca estricta?
   * ¿La carpeta de destino tiene permisos de ejecución desactivados?
2. **Nginx / Proxies Inversos:**
   * Verificar directivas `location` y `proxy_pass` o `alias`. Comprobar que no exista la vulnerabilidad de barra faltante (*off-by-slash*) que permita traversal en `/static` o `/fotos`.
3. **Contenedores Docker:**
   * ¿Los servicios internos (Redis, PostgreSQL, panel de administración de NPM) están expuestos a internet o aislados en la red privada de Docker (`127.0.0.1` / red interna)?
   * ¿Los contenedores corren como usuario no-root cuando sea posible?

---

### Fase 5: Estructura del Reporte de Auditoría

Al concluir la revisión, el agente debe presentar un reporte estructurado al usuario con el siguiente formato:

```markdown
# 🛡️ Reporte de Auditoría de Seguridad

### 1. Resumen Ejecutivo
- Estado general del proyecto: [Seguro / Atención requerida / Crítico]
- Vectores analizados: LFI, RCE, Inyección SQL, Dependencias, Permisos.

### 2. Hallazgos por Categoría
- **LFI / Path Traversal:** [Detalle y líneas auditadas]
- **RCE / Inyección de Comandos:** [Detalle y líneas auditadas]
- **SAST (Bandit / Semgrep):** [Resumen de alertas]
- **Dependencias (pip-audit / pnpm audit):** [Vulnerabilidades conocidas]

### 3. Plan de Remediación
- [Acción 1]: Descripción del fix necesario.
- [Acción 2]: Buenas prácticas recomendadas.
```

Si se aplicaron cambios o correcciones en el código, concluir con la sugerencia de commit en dos partes (Comando y Mensaje).
