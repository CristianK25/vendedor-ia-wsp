¡Excelente elección! El **Módulo 2 (Vehículos e Inventario)** es perfecto para comenzar porque concentra lógica de archivos físicos (imágenes), base de datos relacional con claves únicas y constraints, y consumo de APIs desde el frontend.

Al analizar a fondo el código, he detectado **5 problemas, vulnerabilidades y oportunidades de mejora importantes**. Aquí tienes el diagnóstico detallado:

---

### 1. 🐞 Bug en la eliminación de vehículos (Fuga de almacenamiento / Archivos huérfanos)
*   **Archivos afectados:** 
    *   [delete_vehiculo en service.py](file:///home/cristian/trabajo/vendedor-ia-n8n/backend/app/Modules/vehiculos/service.py#L82-L96)
    *   [delete en repository.py](file:///home/cristian/trabajo/vendedor-ia-n8n/backend/app/Modules/vehiculos/repository.py#L105-L108)
*   **Detalle del problema:** 
    El servicio primero borra el registro de la base de datos llamando a `self.repository.delete(vehiculo)`, el cual hace un `self.session.commit()`. Debido a la relación de cascada (`ondelete="CASCADE"`), Postgres elimina las filas asociadas en la tabla `vehiculo_imagenes`. 
    
    Cuando inmediatamente después el servicio ejecuta `img_service.limpiar_archivos(imagenes)` pasándole los objetos SQLAlchemy, estas instancias de imagen ya han sido eliminadas de la base de datos y la sesión se ha cerrado. Intentar leer `img.ruta` en [limpiar_archivos](file:///home/cristian/trabajo/vendedor-ia-n8n/backend/app/Modules/imagenes/service.py#L69-L76) causará un error `DetachedInstanceError` o no eliminará nada.
*   **Consecuencia:** Las fotos físicas de los vehículos eliminados **permanecen almacenadas para siempre** en la carpeta `/fotos` del servidor, causando que el disco de la VPS se llene progresivamente.
*   **Solución propuesta:** Extraer las rutas físicas en una lista simple de strings *antes* de borrar el registro de la base de datos:
    ```python
    rutas_a_borrar = [img.ruta for img in vehiculo.imagenes]
    self.repository.delete(vehiculo)
    # Luego borrar los archivos usando estas rutas fijas
    ```

---

### 2. 🌐 Imágenes rotas en Producción (Host backend hardcodeado)
*   **Archivos afectados:** 
    *   [VehiculoDetailPage.tsx#L111](file:///home/cristian/trabajo/vendedor-ia-n8n/frontend/src/pages/VehiculoDetailPage.tsx#L111) y [#L147](file:///home/cristian/trabajo/vendedor-ia-n8n/frontend/src/pages/VehiculoDetailPage.tsx#L147)
    *   [VehiculosPage.tsx#L448](file:///home/cristian/trabajo/vendedor-ia-n8n/frontend/src/pages/VehiculosPage.tsx#L448)
*   **Detalle del problema:** 
    En el frontend, las URLs de las imágenes se arman concatenando de forma fija el dominio local: `http://localhost:8000${img.ruta}`.
*   **Consecuencia:** Al desplegar la aplicación en producción en una VPS (bajo un dominio real), las imágenes intentarán cargarse desde la máquina local del cliente que esté navegando en la web, resultando en imágenes rotas para todos los usuarios externos.
*   **Causa raíz secundaria:** El proxy inverso en [nginx.conf](file:///home/cristian/trabajo/vendedor-ia-n8n/frontend/nginx.conf) y la configuración de desarrollo en [vite.config.ts](file:///home/cristian/trabajo/vendedor-ia-n8n/frontend/vite.config.ts) solo redirigen `/api`, pero no tienen una regla para servir o redirigir las solicitudes a `/fotos`.
*   **Solución propuesta:**
    1.  Agregar una regla de proxy para `/fotos` en `vite.config.ts` y en `nginx.conf`.
    2.  En React, quitar la URL hardcodeada de `localhost:8000` y usar rutas relativas directas, delegando la ruta al propio servidor (ej: `src={img.ruta}`).

---

### 3. 💥 Transaccionalidad débil al crear vehículos
*   **Archivo afectado:** 
    *   [create_vehiculo_con_imagenes en service.py](file:///home/cristian/trabajo/vendedor-ia-n8n/backend/app/Modules/vehiculos/service.py#L48-L73)
*   **Detalle del problema:** 
    El backend inserta el vehículo en la base de datos y hace `commit` de inmediato. Después, empieza a procesar las imágenes una por una. Si la carga física de las fotos en disco falla, ejecuta un borrado manual compensatorio: `self.repository.delete(vehiculo_creado)`.
*   **Consecuencia:** Si el servidor se apaga o sufre un crash justo después de guardar el vehículo pero antes de procesar las fotos, quedarán vehículos guardados a medias en la base de datos sin sus imágenes principales, rompiendo la consistencia visual del sistema.
*   **Solución propuesta:** Hacer que toda la operación sea atómica dentro de la misma transacción:
    1.  Hacer un `self.session.add(vehiculo)` y `self.session.flush()` (obtiene el ID autogenerado sin guardar los cambios permanentemente todavía).
    2.  Procesar y guardar las imágenes físicamente.
    3.  Añadir los registros de las imágenes a la sesión.
    4.  Hacer un único `self.session.commit()` al final. Si ocurre cualquier error, se ejecuta `self.session.rollback()` y se limpian las fotos físicas guardadas durante ese intento.

---

### 4. 🛑 Vulnerabilidad de Denegación de Servicio (DoS) y manejo de excepciones en Imágenes
*   **Archivo afectado:** 
    *   [procesar_y_guardar_imagenes en imagenes/service.py](file:///home/cristian/trabajo/vendedor-ia-n8n/backend/app/Modules/imagenes/service.py#L16-L68)
*   **Detalles del problema:**
    *   **Sin límite de tamaño:** El código hace `content = await file.read()` directamente. Si un usuario (o atacante) sube archivos de 100MB+, se cargarán enteros en la memoria RAM, pudiendo tumbar el servicio del backend por consumo de memoria (OOM Crash).
    *   **Sin límite de cantidad:** Un administrador puede subir infinitas imágenes en una sola petición, saturando el espacio de disco de la VPS.
    *   **Errores 500 para fallos del cliente:** Si se sube un archivo dañado o que no es una imagen, Pillow lanzará `UnidentifiedImageError`. El backend atrapa esta excepción y responde con un código HTTP `500 Internal Server Error`.
*   **Soluciones propuestas:**
    *   Implementar validaciones previas de tamaño máximo de archivo (ej. máximo 5MB por foto) y cantidad máxima de imágenes por vehículo (ej. 10 fotos).
    *   Atrapar excepciones específicas de Pillow para devolver códigos de error HTTP `400 Bad Request` claros al cliente (ej. *"El archivo provisto no es una imagen válida"*).

---

### 5. ⚙️ Limitación de la Experiencia de Usuario: Edición de fotos
*   **Archivo afectado:** 
    *   [VehiculoForm.tsx](file:///home/cristian/trabajo/vendedor-ia-n8n/frontend/src/components/forms/VehiculoForm.tsx#L68-L83)
*   **Detalle del problema:**
    Actualmente, el formulario oculta la sección de imágenes si `isEditMode` es verdadero. Por lo tanto, si el administrador desea cambiar las fotos, agregar nuevas o corregir el orden, no puede hacerlo a menos que elimine todo el vehículo y lo cree de nuevo.

---

### Preguntas para definir cómo proceder:
1.  **¿Implementamos la solución del Bug del borrado y la transaccionalidad atómica (Puntos 1 y 3) en el Backend?**
2.  **¿Corregimos el proxy inverso (Nginx y Vite) para quitar la URL de `localhost:8000` de las imágenes en React (Punto 2)?**
3.  **¿Quieres agregar la validación de tamaño máximo de archivo/imágenes y respuestas HTTP 400 amigables en el Backend (Punto 4)?**
4.  **¿Te gustaría que diseñemos e implementemos el soporte para gestionar (editar, agregar y eliminar) imágenes en vehículos ya existentes (Punto 5)?**


### RESPUESTAS:

1.**