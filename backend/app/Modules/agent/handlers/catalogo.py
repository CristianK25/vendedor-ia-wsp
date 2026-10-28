import os
import json
import logging
from typing import Optional
import requests
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.Modules.vehiculos.model import Vehiculo, EstadoVehiculo
from app.Modules.agent.schema import AgentChatRequest, AgentChatResponse
from app.Modules.agent.handlers.base import BaseHandler

logger = logging.getLogger("agent.catalogo")

# =====================================================================
# 1. Esquema de Salida Estructurada para Catálogo (Reemplaza Agent Tools)
# =====================================================================
class DecisionCatalogo(BaseModel):
    respuesta_whatsapp: str = Field(
        description="Mensaje en español argentino con voseo (2 a 4 líneas), cercano y cordial, que responde con datos del stock y termina con una pregunta o propuesta para ver el auto."
    )
    vehiculo_interes_id: Optional[int] = Field(
        default=None,
        description="ID numérico del vehículo del stock por el cual el cliente consultó o mostró interés (si aplica)."
    )
    quiere_coordinar_visita: bool = Field(
        default=False,
        description="True si el cliente expresó interés en ver el auto, coordinar una cita o visitarnos."
    )
    derivar_a_maxi: bool = Field(
        default=False,
        description="True si el cliente pide descuento agresivo, quiere señar ya mismo, tiene un reclamo o pide hablar con Maxi."
    )

# =====================================================================
# 2. System Prompt especializado en Catálogo (Extraído de _prompt.txt)
# =====================================================================
PROMPT_CATALOGO_TEMPLATE = """Sos el asistente de Maxi Panella, vendedor de autos usados en Mendoza Capital. Respondés consultas de clientes por WhatsApp exclusivamente sobre los vehículos que Maxi tiene en venta.

## TU OBJETIVO
1. Responder rápido, claro y con datos reales sobre los autos en stock (precios, km, año, características).
2. Generar interés y conseguir que el cliente coordine día y horario para venir a ver el auto en persona.
3. Si el auto que busca no está disponible, ofrecer con sinceridad 1 o 2 alternativas parecidas de nuestro stock actual.

## CÓMO HABLÁS
- Español argentino, con voseo ("buscás", "querés", "mirá", "fijate", "tenés"). Cercano, amable, seguro, nunca acartonado ni robótico.
- Mensajes CORTOS, estilo WhatsApp: 2 a 4 líneas como máximo.
- Podés usar algún emoji ocasional (🚗, 👌, 👋), sin exagerar.
- SIEMPRE terminá con una pregunta o propuesta concreta para seguir la conversación o invitarlo a coordinar visita (ej: "¿Te gustaría coordinar para verlo?", "¿Buscás contado o te interesa financiar una parte?").
- NUNCA menciones nombres de empresas, agencias ni locales. Si preguntan dónde están los autos o de qué agencia es: "Los autos los muestro yo en Mendoza Capital, coordinamos un horario y te paso la ubicación".

## REGLAS IMPORTANTES DE STOCK
1. Usá ÚNICAMENTE la información del STOCK ACTUAL provisto abajo. NUNCA inventes vehículos, precios ni kilometrajes. Si un dato no figura en la ficha: decí "Te lo confirmo y te aviso".
2. Si el auto consultado está DISPONIBLE: confirmalo amablemente, mencioná precio, año y kilometraje, y preguntá si quiere coordinar para verlo.
3. Si el auto NO está en stock (o está vendido/señado): decilo con franqueza y ofrecé 1 o 2 alternativas reales parecidas del stock en rango de precio o segmento similar.
4. NO negocies descuentos ni confirmes precios finales por chat: "El precio final lo charlamos cuando lo veas".
5. Financiación: Si pregunta por cuotas, mencioná que se puede financiar una parte pero no des cuotas exactas; proponé verlo en persona para analizarlo con Maxi.
6. Cuándo derivar a Maxi (marcar derivar_a_maxi = true):
   - El cliente está molesto, tiene un reclamo o exige hablar con una persona.
   - Quiere cerrar ya mismo, señar o pide negociar precio fuertemente.

## STOCK ACTUAL DISPONIBLE EN TIEMPO REAL:
{stock_actual}
"""

class CatalogoHandler(BaseHandler):
    """Manejador especializado en el camino de Catálogo y Stock."""

    @staticmethod
    def obtener_stock_resumen(session: Session) -> str:
        """Consulta el stock activo en PostgreSQL y arma un resumen compacto."""
        statement = select(Vehiculo).where(
            Vehiculo.estado == EstadoVehiculo.disponible,
            Vehiculo.activo == True
        )
        vehiculos = session.exec(statement).all()

        if not vehiculos:
            return "Actualmente no hay vehículos disponibles en stock."

        lineas = []
        for v in vehiculos:
            moneda = v.moneda_venta.value if v.moneda_venta else "PESOS"
            if moneda == "USD":
                precio_str = f"USD {v.precio_venta:,.0f}"
            else:
                precio_str = f"${v.precio_venta:,.0f}".replace(",", ".")
            
            tipo_desc = f" ({v.tipo})" if v.tipo else ""
            lineas.append(
                f"- [ID: {v.id}] {v.marca} {v.modelo} {v.anio} | {v.kilometraje:,} km | {precio_str} | Transmisión: {v.transmision}{tipo_desc}"
            )
        return "\n".join(lineas)

    @staticmethod
    def _llamar_llm_estructurado(system_prompt: str, user_message: str) -> DecisionCatalogo:
        """
        Invoca al LLM configurado (Groq o Gemini) forzando salida estructurada JSON
        que se valida directamente contra el modelo Pydantic DecisionCatalogo.
        """
        groq_api_key = os.getenv("GROQ_API_KEY")
        gemini_api_key = os.getenv("GEMINI_API_KEY")

        instruccion_formato = (
            "\n\nIMPORTANTE: Debes responder EXCLUSIVAMENTE con un JSON válido con esta estructura exacta:\n"
            "{\n"
            '  "respuesta_whatsapp": "Tu mensaje corto en argentino con voseo",\n'
            '  "vehiculo_interes_id": 123 o null,\n'
            '  "quiere_coordinar_visita": true o false,\n'
            '  "derivar_a_maxi": true o false\n'
            "}"
        )

        full_system = system_prompt + instruccion_formato

        # Prioridad 1: Groq (ultra rápido en producción ~200ms)
        if groq_api_key:
            try:
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {groq_api_key}",
                    "Content-Type": "application/json"
                }
                body = {
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": full_system},
                        {"role": "user", "content": user_message}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.2
                }
                resp = requests.post(url, headers=headers, json=body, timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    return DecisionCatalogo(**parsed)
                else:
                    logger.error(f"Error en llamada a Groq: {resp.status_code} - {resp.text}")
            except Exception as e:
                logger.exception(f"Excepción al llamar a Groq: {e}")

        # Prioridad 2: Gemini API
        if gemini_api_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_api_key}"
                headers = {"Content-Type": "application/json"}
                body = {
                    "system_instruction": {"parts": [{"text": full_system}]},
                    "contents": [{"parts": [{"text": user_message}]}],
                    "generationConfig": {
                        "response_mime_type": "application/json",
                        "temperature": 0.2
                    }
                }
                resp = requests.post(url, headers=headers, json=body, timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(content)
                    return DecisionCatalogo(**parsed)
            except Exception as e:
                logger.exception(f"Excepción al llamar a Gemini: {e}")

        # Fallback de seguridad si no hay API key o fallaron las peticiones
        return DecisionCatalogo(
            respuesta_whatsapp="¡Hola! Gracias por consultar. En este momento estoy actualizando el stock, pero dejame tu consulta y te paso la info enseguida 👌 ¿Buscás algún modelo en particular?",
            vehiculo_interes_id=None,
            quiere_coordinar_visita=False,
            derivar_a_maxi=False
        )

    async def handle(self, payload: AgentChatRequest, session: Session) -> AgentChatResponse:
        """Procesa una consulta de catálogo en tiempo real con stock directo de Postgres."""
        stock_texto = self.obtener_stock_resumen(session)
        system_prompt = PROMPT_CATALOGO_TEMPLATE.format(stock_actual=stock_texto)

        mensaje_cliente = payload.mensaje.lstrip("=").strip()
        decision = self._llamar_llm_estructurado(system_prompt, mensaje_cliente)

        # Lógica de negocio en Python puro:
        accion = "consulta_stock"
        if decision.quiere_coordinar_visita:
            accion = "intencion_visita"
        elif decision.derivar_a_maxi:
            accion = "derivado_humano"

        return AgentChatResponse(
            respuesta_texto=decision.respuesta_whatsapp,
            camino="catalogo",
            accion_ejecutada=accion,
            derivar_a_humano=decision.derivar_a_maxi,
            metadata={
                "vehiculo_interes_id": decision.vehiculo_interes_id,
                "quiere_coordinar_visita": decision.quiere_coordinar_visita,
                "session_id": payload.session_id,
                "telefono": payload.cliente_telefono
            }
        )

