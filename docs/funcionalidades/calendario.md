He analizado a fondo la estructura de **Citas y Calendario (Módulo 4)** tanto en el Backend (FastAPI + SQLModel) como en el Frontend (React + FullCalendar).

Al descartar Google Calendar y centrarnos en el **calendario interno de la app**, he descubierto varias inconsistencias críticas, bugs silenciosos y oportunidades de mejora muy importantes para la estabilidad del sistema.

Aquí tienes el análisis técnico detallado:

---

### 1. ⚠️ El gran vacío de información: ¿Qué vehículo se va a ver?
- **El Bug/Inconsistencia:** En la base de datos, cada cita (`Cita`) tiene un `vehiculo_id` opcional que apunta al auto de interés del cliente. Sin embargo, en el frontend, el componente [CitaModal.tsx](file:///home/cristian/trabajo/vendedor-ia-n8n/frontend/src/components/CitaModal.tsx) **ignora por completo el vehículo**.
- **Consecuencia:** Cuando un vendedor hace clic en una cita del calendario, ve los datos del cliente (nombre, teléfono, compras anteriores) y la hora, pero **no tiene idea de qué vehículo viene a ver el cliente** (el auto no se renderiza en ningún lado).

### 2. 📅 Falta de interacción (El Calendario es un "fantasma")
- **El Bug/Inconsistencia:** El backend tiene endpoints listos para crear (`POST`), reprogramar (`PUT` a `/citas/{id}`) y cancelar/eliminar (`DELETE` a `/citas/{id}`) citas. No obstante, en el frontend:
  - `handleDateClick` en el calendario está vacío (comentado). No puedes hacer clic en un día vacío para agendar una cita.
  - El modal de cita es meramente informativo. No existen botones para **"Confirmar Cita"**, **"Cancelar Cita"**, o **"Reprogramar Turno"**.
- **Consecuencia:** El personal de la concesionaria está obligado a agendar citas usando n8n (WhatsApp) o tocando la base de datos de manera externa; no pueden gestionar el calendario de forma manual desde el panel de control.

### 3. 🚨 Ausencia de restricciones de duplicados en la base de datos
- **El Bug/Inconsistencia:** En la definición del modelo [model.py](file:///home/cristian/trabajo/vendedor-ia-n8n/backend/app/Modules/citas/model.py):
  ```python
  class Cita(SQLModel, table=True):
      __tablename__ = "citas"
      id: Optional[int] = Field(default=None, primary_key=True)
      cliente_telefono: str = Field(foreign_key="clientes.telefono")
      vehiculo_id: Optional[int] = Field(default=None, foreign_key="vehiculos.id")
      fecha: datetime
  ```
  No existe ninguna restricción de unicidad (`unique=True` o `UniqueConstraint`) para evitar que el mismo cliente agende dos citas a la misma hora o el mismo día. Tampoco se valida en el `service.py` si la fecha elegida ya está ocupada por otro cliente.
- **Consecuencia:** Es posible agendar citas superpuestas (dos personas a la misma hora con el mismo vendedor) o que el bot de n8n cree registros duplicados por fallas en la lógica del flujo.

### 4. 🔄 Desperdicio de CPU y Red: Polling de 10 segundos
- **El Bug/Inconsistencia:** En [CalendarPage.tsx](file:///home/cristian/trabajo/vendedor-ia-n8n/frontend/src/pages/CalendarPage.tsx), se utiliza un `setInterval` que ejecuta `citasApi.getAll()` cada 10 segundos para actualizar el calendario.
- **Consecuencia:** Si tienes 500 citas agendadas a lo largo de los meses, la app descargará la lista completa de citas cada 10 segundos, consumiendo ancho de banda y procesador de la base de datos innecesariamente. En su lugar, FullCalendar permite pedir citas paginadas según el mes que el usuario esté mirando actualmente.

---

### ¿Cómo lo mejoramos? Mi propuesta de Plan de Acción:

1.  **Resolver el Vacío de Información:**
    - Modificar el backend para que al consultar la cita, traiga también el modelo/marca del vehículo asociado.
    - Modificar el `CitaModal.tsx` en el frontend para mostrar una pequeña tarjeta con los datos del vehículo de interés.
2.  **Agregar Gestión desde el Calendario:**
    - En el `CitaModal.tsx`, agregar un botón de **"Cancelar Cita"** (que llame a la API `DELETE /citas/{id}` o cambie su estado a `cancelada`).
    - Permitir cambiar el estado de la cita desde el modal (ej: pasar de "pendiente" a "confirmada").
3.  **Validación en Backend (Prevención de Choques):**
    - En `CitaService.create_cita`, verificar antes de guardar si el cliente ya tiene una cita ese mismo día o si el horario está ocupado.
4.  **Optimizar el Polling:**
    - Cambiar el pooling de 10s o hacer que descargue solo el rango visible del calendario.

¿Qué opinas de este análisis? ¿Por cuál de estas mejoras del Módulo 4 te gustaría que empecemos a trabajar?