# 🗄️ Guía de Manejo y Mantenimiento de SQLite

SQLite es una elección brillante para una arquitectura Single-Tenant. A diferencia de MySQL o PostgreSQL, **SQLite no es un servidor ni un servicio que se deba "correr"**. Es simplemente un archivo en tu disco duro que contiene toda la estructura de tablas y datos. El propio n8n tiene el motor interno para leer y escribir en ese archivo.

Aquí tienes las respuestas detalladas a tus consultas sobre cómo gestionarlo:

## 1. ¿Cómo crear el archivo SQLite y dónde?

*   **¿Dónde?** Debes crearlo **dentro** de la carpeta que montamos como volumen en Docker, es decir, en `./n8n_data`. Esto permite que el archivo persista en tu VPS y que n8n pueda acceder a él desde adentro del contenedor (en la ruta `/home/node/.n8n/`).
*   **¿Cómo?** Puedes crearlo desde la terminal de tu VPS. Si instalas el cliente de SQLite, basta con ejecutar:
    ```bash
    # Asegúrate de estar en la carpeta raíz del proyecto (donde está el docker-compose)
    sqlite3 ./n8n_data/negocio.sqlite
    ```
    Una vez dentro de la consola de SQLite (`sqlite>`), puedes pegar directamente los scripts `CREATE TABLE` que definiste en tu documento de seguimiento y luego salir escribiendo `.exit`. ¡El archivo `negocio.sqlite` se creará automáticamente!

## 2. ¿Cómo hacerlo "correr"?

**No tienes que hacer nada.** Como mencioné, SQLite no es un servicio en segundo plano. No usa RAM continua ni necesita un contenedor Docker separado. El contenedor de n8n simplemente abre el archivo `.sqlite`, escribe en él y lo cierra en microsegundos cada vez que un nodo SQL se ejecuta.

## 3. ¿Cómo acceder a los datos para verlos o editarlos a mano?

Tienes tres opciones principales:

*   **Opción A (La más rápida - Terminal VPS):** Entras por SSH a la VPS y usas la línea de comandos:
    ```bash
    sqlite3 ./n8n_data/negocio.sqlite
    # Y ejecutas consultas, ej:
    sqlite> SELECT * FROM clientes;
    ```
*   **Opción B (Visual e ideal para clientes):** Crear un flujo súper simple en n8n con un **Webhook (GET)** que haga un `SELECT *` y devuelva un JSON o HTML básico para que tú o tu cliente puedan ver el inventario desde el navegador sin entrar a la VPS.
*   **Opción C (Herramienta Profesional Remota):** Si tienes un programa en tu PC como **DBeaver** o **DB Browser for SQLite**, puedes conectarte a tu VPS mediante "Túnel SSH" y abrir el archivo remotamente. Verás toda la base de datos con una interfaz gráfica hermosa (como si fuera un Excel), pudiendo editar celdas, agregar filas y guardar los cambios directamente en el servidor.

## 4. ¿Cómo mantenerlo y hacer Backups?

El mantenimiento de SQLite es lo más fácil del mundo porque es un solo archivo.
*   **Backup Manual:** Para hacer una copia de seguridad total, solo copias el archivo.
    ```bash
    cp ./n8n_data/negocio.sqlite ./negocio_backup.sqlite
    ```
*   **Backup Automático:** Puedes crear un script cron (o un pequeño flujo en n8n) que todos los días a las 3:00 AM haga una copia de `negocio.sqlite` y le ponga la fecha en el nombre, e incluso la suba a Google Drive.
*   **Importante:** Nunca borres ese archivo. Si el archivo desaparece, se pierde la base de datos.

## 5. ¿Cómo agregarle cosas en el futuro (Escalabilidad)?

Si mañana el cliente te dice *"Quiero guardar también el email de los clientes"* o *"Quiero una tabla para registrar proveedores"*, el proceso es indoloro:

1.  **Añadir Columnas:** Entras a la base de datos (por consola o DBeaver) y ejecutas una sentencia estándar de SQL para alterar la tabla sin borrar los datos existentes:
    ```sql
    ALTER TABLE clientes ADD COLUMN email TEXT;
    ```
2.  **Nuevas Tablas:** Simplemente ejecutas otro `CREATE TABLE proveedores (...)` en el mismo archivo.
3.  **Ajustar n8n:** Vas a tu flujo de n8n y actualizas las consultas SQL de los nodos para que empiecen a usar esa nueva columna o tabla. 

No hay migraciones complejas, ni tiempos de caída (downtime). SQLite soporta terabytes de datos y cientos de miles de lecturas por segundo, por lo que para un Agente de Ventas por WhatsApp, tienes motor de sobra para años de operación.
