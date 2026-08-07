# Guía de Trabajo: Migraciones con Alembic y SQLModel

Este documento explica cómo es el flujo de trabajo diario ahora que el proyecto utiliza **Alembic** para gestionar los cambios en la base de datos PostgreSQL.

## 1. ¿Por qué usamos Alembic?

Anteriormente, usábamos `SQLModel.metadata.create_all(engine)`. Este comando **solo** sirve para crear tablas nuevas; **no** es capaz de agregar, modificar ni eliminar columnas de tablas que ya existen. 
Alembic resuelve esto creando un historial de "migraciones" (como si fuera un Git para tu base de datos) que te permite actualizar la base de datos de producción sin perder ni un solo dato de tus clientes.

---

## 2. Flujo de Trabajo Diario (Paso a Paso)

Cada vez que necesites cambiar algo en la estructura de tu base de datos (agregar una columna, cambiar un tipo de dato, etc.), este será tu nuevo proceso:

### Paso 1: Modificar tu código Python
Vas a los archivos de tus modelos (por ejemplo, `backend/app/Modules/clientes/model.py`) y hacés el cambio que necesites. Por ejemplo, agregás un nuevo campo:
```python
# Ejemplo: agregando un campo de email al Cliente
email: Optional[str] = Field(default=None)
```

### Paso 2: Generar la Migración (Solo en Desarrollo)
Tenés que decirle a Alembic que analice tu código y genere un archivo con las instrucciones SQL para actualizar la base de datos.
Abrí una terminal **dentro de la carpeta `backend`**, activá tu entorno virtual, y ejecutá:

```bash
# 1. Asegurate de estar en backend y con el venv activado
cd backend
source venv/bin/activate

# 2. Generá la migración con un mensaje claro de lo que cambiaste
alembic revision --autogenerate -m "agregue campo email a cliente"
```

> **Aviso:** Alembic va a crear un archivo de extensión `.py` en la carpeta `backend/alembic/versions/`. **Ese archivo debe subirse a Git (GitHub/GitLab) junto con el resto de tu código.**

### Paso 3: Aplicar la Migración (Para probar localmente)
Una vez que el archivo se generó, tu base de datos local todavía no tiene el cambio. Para aplicarlo, ejecutá:

```bash
alembic upgrade head
```
¡Listo! Tu base de datos local ya tiene la nueva columna.

---

## 3. ¿Qué pasa en Producción (VPS)?

¡La mejor parte de esta configuración es que no tenés que hacer nada a mano en el servidor!

Tu archivo `docker-compose.yml` está configurado para ejecutar `alembic upgrade head` automáticamente cada vez que el contenedor del backend se enciende.

El flujo de despliegue será:
1. Hacés commit y push de tus cambios en Python **y del archivo de migración generado en `alembic/versions/`**.
2. En tu VPS, bajás los últimos cambios con `git pull`.
3. Reiniciás el contenedor con `docker compose up --build -d`.
4. El contenedor arranca, ejecuta la migración y recién ahí levanta la API de FastAPI. **Cero pérdida de datos.**

---

## 4. Resolviendo el problema clásico: "NOT NULL Violation"

**El Error:**
Si agregás una nueva columna que sea obligatoria (ej: `nuevo_campo: str = Field(...)` o sin `Optional`), y tu tabla ya tiene filas insertadas (ej: 100 clientes), PostgreSQL se va a quejar diciendo que no puede agregar una columna vacía a esas 100 filas existentes.

**La Solución:**
Si vas a agregar una columna obligatoria a una tabla con datos, Alembic te generará el script, pero fallará al hacer `upgrade`. Para solucionarlo, tenés que editar el script generado en `alembic/versions/` y decirle a la base de datos qué ponerle por defecto a las filas viejas:

1. Abrí el último script en `alembic/versions/`.
2. Buscá la línea que hace el `add_column`.
3. Agregale el parámetro `server_default`:

**Antes (como lo genera Alembic por defecto):**
```python
op.add_column('clientes', sa.Column('nuevo_campo', sa.String(), nullable=False))
```

**Después (como deberías arreglarlo):**
```python
op.add_column('clientes', sa.Column('nuevo_campo', sa.String(), server_default='valor temporal', nullable=False))
```
Luego ejecutás `alembic upgrade head` y el error desaparecerá.

---

## Resumen de Comandos Útiles

- **Crear migración**: `alembic revision --autogenerate -m "tu mensaje"`
- **Aplicar migraciones**: `alembic upgrade head`
- **Ver historial de migraciones**: `alembic history`
- **Revertir la última migración (si te equivocaste localmente)**: `alembic downgrade -1`
