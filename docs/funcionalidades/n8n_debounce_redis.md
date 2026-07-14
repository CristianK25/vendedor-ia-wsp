# Implementación de Debounce (Acumulador) con Redis en n8n

Esta guía detalla cómo configurar un flujo en n8n para acumular mensajes rápidos (ej. cuando un usuario envía varios mensajes separados en menos de 3-5 segundos) y procesarlos como un solo bloque de texto. Esto mejora enormemente el contexto para la IA y ahorra costos (tokens y ejecuciones concurrentes).

## El Problema
Si un usuario escribe:
1. "Hola"
2. "quiero saber el precio"
3. "del auto rojo"

Si n8n procesa cada mensaje individualmente, levantará 3 ejecuciones en paralelo. La IA responderá 3 veces sin tener el contexto completo de las otras peticiones.

## La Solución: Flujo "Debounce"
Utilizaremos Redis para ir apilando los mensajes en una lista, y un sistema de "bloqueo" numérico para que solo la **primera** ejecución espere unos segundos y luego recoja todo el paquete acumulado.

---

### Paso a Paso en n8n

#### 1. Nodo Trigger (Telegram / WhatsApp)
Es tu nodo inicial que recibe el evento `message`. Extrae de aquí el ID del chat (`chat_id`) y el texto del mensaje (`text`).

#### 2. Nodo Redis 1: Guardar el mensaje (Push)
Añadimos el mensaje entrante a una lista temporal exclusiva de ese usuario.
* **Operación:** `Push data to a redis list`
* **Key:** `mensajes:{{ $json.chat_id }}` (Reemplaza con tu variable dinámica del chat ID).
* **Value:** `{{ $json.text }}`

#### 3. Nodo Redis 2: Incrementar Contador (Lock)
Usaremos un contador atómico para saber si esta ejecución de n8n es la primera del usuario en esta "ráfaga" de mensajes o si es una ejecución subsecuente.
* **Operación:** `Atomically increment a key by 1. Creates the key if it does not exist.`
* **Key:** `esperando:{{ $json.chat_id }}`
* *(Este nodo te devolverá un valor numérico, ej. 1, 2, 3...)*

#### 4. Nodo IF: ¿Es el primer mensaje?
Evaluamos el resultado del nodo anterior.
* **Condición:** Si el valor devuelto por Redis es `Equal to 1`.
* **Rama False (No es 1):** Significa que es el mensaje 2, 3, etc. **Pon un nodo de Stop o simplemente termina el flujo ahí**. El mensaje ya quedó guardado en la lista del Paso 2 y será procesado por la ejecución principal.
* **Rama True (Es 1):** Es la primera ejecución. Avanza al Paso 5.

#### 5. Nodo Wait: La ventana de tiempo
Le damos tiempo al usuario para terminar de escribir.
* **Tipo:** `Wait for fixed amount of time`
* **Duración:** 3 a 5 segundos (según prefieras).

#### 6. Nodo Redis 3: Recuperar todos los mensajes
Al despertar del Wait, necesitamos extraer todo lo que se acumuló en la lista. En n8n, la forma más fácil si tu nodo Redis no permite comandos crudos es usar un Loop para extraerlos:
* *Alternativa A (Si tienes Custom Command habilitado en Redis):* Ejecuta `LRANGE mensajes:{{ $json.chat_id }} 0 -1`.
* *Alternativa B (Nodos estándar):*
  1. Conecta un nodo **Loop**.
  2. Dentro del loop, usa el nodo Redis: `Pop data from a redis list` (Key: `mensajes:{{ $json.chat_id }}`).
  3. Usa un IF: ¿Devolvió algún dato? Si Sí, vuelve al Loop. Si No (es nulo), sal del Loop.
  4. Usa un nodo **Item Lists** (o **Code**) para concatenar todos los textos recolectados (ej. separarlos por `\n`).

#### 7. Nodo Redis 4: Limpiar el Contador (Delete)
Borramos la llave que bloqueaba el flujo para que el usuario pueda volver a mandar ráfagas de mensajes en el futuro.
* **Operación:** `Delete a key from Redis`
* **Key:** `esperando:{{ $json.chat_id }}`

#### 8. Nodo Guardar Telefono (Postgres)
Continúas tu flujo normal, guardando/actualizando el usuario en tu base de datos tal como lo tienes actualmente.

#### 9. Nodo AI Agent
* En el campo de input del AI Agent, en lugar de pasarle el mensaje original del Trigger, le pasas el **texto largo concatenado** que armaste en el Paso 6.
* La IA leerá: *"Hola \n quiero saber el precio \n del auto rojo"* de una sola vez, dándole la respuesta perfecta.

#### 10. Nodo Send (Telegram / WhatsApp)
Envías la respuesta devuelta por el AI Agent de regreso al usuario.

---

### Resumen de la Lógica (Diagrama Conceptual)

```text
Mensaje 1 ("Hola") -> Guarda en Lista -> INCR devuelve 1 -> Pasa el IF -> Espera 4 segs...
Mensaje 2 ("precio?") -> Guarda en Lista -> INCR devuelve 2 -> Falla el IF -> Termina silencioso
Mensaje 3 ("por favor") -> Guarda en Lista -> INCR devuelve 3 -> Falla el IF -> Termina silencioso

(Pasan los 4 segs...) -> La Ejecución 1 despierta -> Extrae la lista ("Hola", "precio?", "por favor") -> Pasa todo al AI Agent -> IA Responde.
```
