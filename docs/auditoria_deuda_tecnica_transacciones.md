# Auditoría Técnica: Gestión Transaccional y Directiva para el Módulo Agent

Este documento registra el análisis arquitectónico sobre la persistencia, manejo de sesiones y atomicidad (`commit`/`rollback`) en el backend, detallando la deuda técnica identificada en los módulos preexistentes y definiendo el estándar de construcción para el nuevo módulo `app/Modules/agent`.

---

## 1. Diagnóstico de los Módulos Preexistentes (Deuda Técnica)

### 1.1 Commits Prematuros en Capa Repository (Falta de Unit of Work)
En la arquitectura original del proyecto, la mayoría de los repositorios (`VentaRepository`, `CitaRepository`, `ClienteRepository`, `GastoRepository`, `VehiculoRepository`) ejecutan `self.session.commit()` de forma interna en sus métodos `create()`, `update()` y `delete()`.

**Riesgo:** Esto rompe el principio de atomicidad (ACID) cuando una operación de negocio en la capa `Service` requiere coordinar múltiples entidades.

#### Caso Crítico Identificado: `VentaService.create_venta`
```text
┌────────────────────────────────────────────────────────┐
│               VentaService.create_venta                │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
  1. vehiculo_repo.update(vehiculo) ──► Hace session.commit()
     (El auto se marca como 'vendido')  [CAMBIO CONFIRMADO EN BD]
                           │
                           ▼
  2. venta_repo.create(venta)       ──► Hace otro session.commit()
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
       [ ÉXITO ]                      [ FALLO ]
  Venta y auto coherentes         (Error de DB o validación)
                                          │
                                          ▼
                                ⚠️ Base de Datos Inconsistente:
                                El auto figura 'vendido', pero la
                                venta no existe en los registros.
```

### 1.2 Ausencia de Manejo Defensivo (`try / except / rollback`)
- Salvo excepciones puntuales donde se aplicó un parche manual (como en `VehiculoService.create_vehiculo_con_imagenes`), la mayoría de los métodos de servicio invocan operaciones de base de datos sin un bloque de contención:
  - Si una operación falla a mitad de camino, la sesión de base de datos puede quedar en estado de aborto (`InFailedSqlTransaction`), afectando peticiones subsiguientes.
  - En servicios con persistencia física de archivos (como `GastoService`), los archivos se escriben en disco antes de confirmar la transacción de base de datos; ante un fallo de SQL, los archivos quedan huérfanos sin posibilidad de rollback automático.

---

## 2. Decisión Arquitectónica y Comercial (Scope del Proyecto)

### 2.1 Estado Operativo Actual
- El producto desarrollado bajo el alcance original de **$800 USD** está operativo, funcional y responde a los casos de uso solicitados.
- Las inconsistencias descritas representan **riesgos de fallo latente**, pero no han generado incidencias reportadas en el flujo cotidiano del cliente.

### 2.2 Decisión de No Refactorizar Módulos Viejos
- **Cancelación de Mantenimiento:** El cliente decidió dar de baja el abono mensual de soporte y mantenimiento ($200 USD/mes).
- **Riesgo de Regresión:** Modificar la firma de todos los repositorios para retirar los `commit()` requeriría reescribir y probar de punta a punta más de 12 módulos en producción. Asumir esa reingeniería sin cobertura contractual expone al desarrollador a reclamos innecesarios si algo se desestabiliza.
- **Directiva:** Los módulos existentes (`ventas`, `citas`, `gastos`, `vehiculos`, etc.) **se mantienen intactos** tal como están funcionando.

---

## 3. Directiva y Blindaje para el Módulo `agent`

El módulo `app/Modules/agent` es el componente en desarrollo activo para finalizar la entrega pactada. Se diseñará con los estándares correctos para garantizar que sea seguro y resiliente:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        ESTÁNDAR MÓDULO AGENT                           │
└────────────────────────────────────────────────────────────────────────┘

    [ HTTP Request (n8n) ]
               │
               ▼
    [ AgentRouter (POST /api/agent/chat) ]
               │ Inyecta Session limpia de FastAPI
               ▼
    [ AgentService.process_chat ]
         │
         ├─► 1. Guarda mensaje usuario (user) con try/except y rollback defensivo
         │
         ├─► 2. Invoca Handler especializado (CatalogoHandler / BaseHandler)
         │       └─► Consultas a PostgreSQL de SOLO LECTURA (Stock activo)
         │
         ├─► 3. Guarda respuesta bot (assistant)
         │
         └─► 4. Confirma transacción atómica (session.commit())
```

### Principios aplicados en `agent`:
1. **Aislamiento de Sesión:** `AgentService` no almacena la sesión en su constructor (`__init__`); la recibe como parámetro por petición, evitando fugas de memoria o concurrencia cruzada.
2. **Manejo Seguro de Historial:** Las inserciones en `agent_chat_messages` deben estar envueltas en control de errores con `session.rollback()` ante cualquier eventualidad.
3. **Handlers de Solo Lectura:** El handler de catálogo (`CatalogoHandler`) únicamente ejecuta queries `select` para consultar el stock disponible, sin mutar datos ni ejecutar commits que puedan corromper el estado de los vehículos.
4. **Mutaciones Controladas:** Si en el futuro un handler realiza una mutación (como crear una cita o registrar un lead), la transacción se gestionará en un único bloque atómico.

---

## 4. Hoja de Ruta para Futuras Versiones (Roadmap Técnico)

En caso de que en el futuro se reactive un contrato de mantenimiento evolutivo, la refactorización recomendada para el resto del backend consistirá en:
1. **Crear `BaseRepository` Limpio:** Eliminar `self.session.commit()` de todos los repositorios. Los repositorios solo deben añadir entidades a la sesión (`add`) o ejecutar consultas (`select`).
2. **Implementar Patrón `UnitOfWork`:** Centralizar el `commit()` y `rollback()` en una clase administradora de transacciones o en la capa `Service` utilizando administradores de contexto (`with uow:`).

