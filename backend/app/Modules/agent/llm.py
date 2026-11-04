import json
import logging
from typing import Any, List, Optional, Type, TypeVar
import requests
from pydantic import BaseModel, ValidationError

from app.Core.config import Settings, settings
from app.Modules.agent.schema import ChatTurn

logger = logging.getLogger("agent.llm")

T = TypeVar("T", bound=BaseModel)


class LLMUnavailableError(Exception):
    """Se lanza cuando ningún proveedor LLM está configurado o todos fallaron al responder."""


class LLMClient:
    """
    Cliente multi-proveedor (OpenAI, Anthropic, Groq, Gemini) con salida estructurada
    validada contra modelos Pydantic y fallback automático en orden de prioridad.
    """

    # Orden de preferencia de modelos gratuitos en Groq si el modelo configurado no está habilitado en la cuenta
    GROQ_FALLBACK_MODELS = [
        "llama-3.3-70b-versatile",
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "meta-llama/llama-4-maverick-17b-128e-instruct",
        "qwen/qwen3-32b",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "llama-3.1-8b-instant",
    ]

    def __init__(self, cfg: Settings = settings, http_session: Optional[requests.Session] = None):
        self.cfg = cfg
        self.http = http_session or requests.Session()
        self._resolved_groq_model: Optional[str] = None

    @staticmethod
    def _clean_json_text(raw_text: str) -> str:
        """Limpia posibles bloques markdown ```json ... ``` antes de parsear."""
        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            if lines and lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            cleaned = "\n".join(lines).strip()
        return cleaned

    @staticmethod
    def _flatten_nested_schema_values(data: Any) -> Any:
        """
        Algunos LLMs (como Llama 3.1 en Groq) a veces devuelven el esquema JSON repitiendo las claves
        como un sub-objeto de metadatos, por ejemplo:
        {"campo": {"type": "string", "description": "valor real"}}
        o {"campo": {"description": "valor real"}}
        Esta función extrae recursivamente el valor real para que Pydantic valide sin error.
        """
        if isinstance(data, dict):
            # Si el dict tiene forma {"description": valor} o {"type": ..., "description": valor}
            # donde description no es la definición del campo sino el contenido devuelto por el modelo
            reconstruido = {}
            for k, v in data.items():
                if isinstance(v, dict) and "description" in v and len(v) <= 3:
                    # Extraer el valor contenido en description o value
                    val = v.get("value", v.get("description"))
                    reconstruido[k] = val
                else:
                    reconstruido[k] = LLMClient._flatten_nested_schema_values(v)
            return reconstruido
        if isinstance(data, list):
            # Si el LLM devolvió una lista de pares clave-valor o una lista con un único objeto
            if len(data) == 1 and isinstance(data[0], dict):
                return LLMClient._flatten_nested_schema_values(data[0])
            return [LLMClient._flatten_nested_schema_values(item) for item in data]
        return data

    @staticmethod
    def _build_schema_instruction(schema_cls: Type[BaseModel]) -> str:
        """Genera la instrucción de esquema JSON a partir del modelo Pydantic."""
        schema_dict = schema_cls.model_json_schema()
        properties = schema_dict.get("properties", {})
        ejemplo_campos = {}
        for k, v in properties.items():
            tipo = v.get("type", "valor")
            desc = v.get("description", "")
            ejemplo_campos[k] = f"<{tipo}: {desc}>"

        return (
            "\n\nIMPORTANTE: Respondé EXCLUSIVAMENTE con un único objeto JSON válido (sin texto adicional ni bloques markdown). "
            "Cada propiedad debe contener DIRECTAMENTE el valor (NO repitas el tipo ni la descripción). Ejemplo de formato:\n"
            f"{json.dumps(ejemplo_campos, ensure_ascii=False, indent=2)}"
        )


    def _call_openai_compatible(
        self,
        provider_name: str,
        url: str,
        api_key: str,
        model: str,
        full_system: str,
        user_message: str,
        historial: Optional[List[ChatTurn]],
    ) -> str:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        messages = [{"role": "system", "content": full_system}]
        if historial:
            for turn in historial:
                role = "assistant" if turn.role == "assistant" else "user"
                messages.append({"role": role, "content": turn.content})
        messages.append({"role": "user", "content": user_message})

        body = {
            "model": model,
            "messages": messages,
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }
        resp = self.http.post(url, headers=headers, json=body, timeout=self.cfg.LLM_TIMEOUT_SECONDS)
        if resp.status_code != 200:
            snippet = resp.text[:200] if resp.text else ""
            raise RuntimeError(f"{provider_name} HTTP {resp.status_code}: {snippet}")

        data = resp.json()
        return data["choices"][0]["message"]["content"]

    def _call_openai(
        self,
        full_system: str,
        user_message: str,
        historial: Optional[List[ChatTurn]],
    ) -> str:
        return self._call_openai_compatible(
            provider_name="openai",
            url="https://api.openai.com/v1/chat/completions",
            api_key=self.cfg.OPENAI_API_KEY,
            model=self.cfg.OPENAI_MODEL,
            full_system=full_system,
            user_message=user_message,
            historial=historial,
        )

    def _discover_groq_model(self, current_failed_model: str) -> Optional[str]:
        """Consulta GET /openai/v1/models en Groq para elegir el mejor modelo habilitado en la API Key."""
        try:
            resp = self.http.get(
                "https://api.groq.com/openai/v1/models",
                headers={"Authorization": f"Bearer {self.cfg.GROQ_API_KEY}"},
                timeout=self.cfg.LLM_TIMEOUT_SECONDS,
            )
            if resp.status_code != 200:
                return None

            data = resp.json().get("data", [])
            available_ids = {m.get("id") for m in data if m.get("id")}
            if not available_ids:
                logger.error(
                    "Groq GET /models devolvió 0 modelos habilitados para esta API Key. "
                    "Revisar permisos del proyecto en https://console.groq.com/settings/limits"
                )
                return None

            for candidate in self.GROQ_FALLBACK_MODELS:
                if candidate in available_ids and candidate != current_failed_model:
                    logger.info(
                        "Modelo Groq '%s' no disponible; usando automáticamente '%s' (disponibles: %s)",
                        current_failed_model,
                        candidate,
                        sorted(available_ids),
                    )
                    return candidate

            # Si ninguno de la lista preferida coincide, elegir cualquier modelo de chat (no whisper/tts/guard)
            for mod_id in sorted(available_ids):
                lower_id = mod_id.lower()
                if mod_id != current_failed_model and not any(
                    skip in lower_id for skip in ("whisper", "tts", "guard", "orpheus", "playai")
                ):
                    logger.info("Usando modelo alternativo descubierto en Groq: '%s'", mod_id)
                    return mod_id
        except requests.RequestException as exc:
            logger.warning("No se pudo consultar la lista de modelos de Groq: %s", type(exc).__name__)
        return None

    def _call_groq(
        self,
        full_system: str,
        user_message: str,
        historial: Optional[List[ChatTurn]],
    ) -> str:
        target_model = self._resolved_groq_model or self.cfg.GROQ_MODEL
        try:
            return self._call_openai_compatible(
                provider_name="groq",
                url="https://api.groq.com/openai/v1/chat/completions",
                api_key=self.cfg.GROQ_API_KEY,
                model=target_model,
                full_system=full_system,
                user_message=user_message,
                historial=historial,
            )
        except RuntimeError as exc:
            err_msg = str(exc).lower()
            if any(k in err_msg for k in ("404", "model_not_found", "400", "429", "rate_limit")):
                fallback_model = self._discover_groq_model(target_model)
                if fallback_model:
                    self._resolved_groq_model = fallback_model
                    return self._call_openai_compatible(
                        provider_name="groq",
                        url="https://api.groq.com/openai/v1/chat/completions",
                        api_key=self.cfg.GROQ_API_KEY,
                        model=fallback_model,
                        full_system=full_system,
                        user_message=user_message,
                        historial=historial,
                    )
            raise

    def _call_openrouter(
        self,
        full_system: str,
        user_message: str,
        historial: Optional[List[ChatTurn]],
    ) -> str:
        headers = {
            "Authorization": f"Bearer {self.cfg.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://vendedor-ia.local",
            "X-Title": "Vendedor IA",
        }
        messages = [{"role": "system", "content": full_system}]
        if historial:
            for turn in historial:
                role = "assistant" if turn.role == "assistant" else "user"
                messages.append({"role": role, "content": turn.content})
        messages.append({"role": "user", "content": user_message})

        body = {
            "model": self.cfg.OPENROUTER_MODEL,
            "messages": messages,
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }
        resp = self.http.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=body,
            timeout=self.cfg.LLM_TIMEOUT_SECONDS,
        )
        if resp.status_code != 200:
            snippet = resp.text[:200] if resp.text else ""
            raise RuntimeError(f"openrouter HTTP {resp.status_code}: {snippet}")

        data = resp.json()
        return data["choices"][0]["message"]["content"]

    def _call_anthropic(
        self,
        full_system: str,
        user_message: str,
        historial: Optional[List[ChatTurn]],
    ) -> str:
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": self.cfg.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        messages = []
        if historial:
            for turn in historial:
                role = "assistant" if turn.role == "assistant" else "user"
                # Anthropic exige alternancia o que el primer mensaje sea user
                if not messages and role != "user":
                    continue
                if messages and messages[-1]["role"] == role:
                    messages[-1]["content"] += f"\n{turn.content}"
                else:
                    messages.append({"role": role, "content": turn.content})

        if messages and messages[-1]["role"] == "user":
            messages[-1]["content"] += f"\n{user_message}"
        else:
            messages.append({"role": "user", "content": user_message})

        body = {
            "model": self.cfg.ANTHROPIC_MODEL,
            "max_tokens": 1024,
            "temperature": 0.2,
            "system": full_system,
            "messages": messages,
        }
        resp = self.http.post(url, headers=headers, json=body, timeout=self.cfg.LLM_TIMEOUT_SECONDS)
        if resp.status_code != 200:
            snippet = resp.text[:200] if resp.text else ""
            raise RuntimeError(f"anthropic HTTP {resp.status_code}: {snippet}")

        data = resp.json()
        return data["content"][0]["text"]

    def _call_gemini(
        self,
        full_system: str,
        user_message: str,
        historial: Optional[List[ChatTurn]],
    ) -> str:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.cfg.GEMINI_MODEL}:generateContent"
        )
        # Seguridad: la API key viaja en cabecera y NUNCA en la URL
        headers = {
            "x-goog-api-key": self.cfg.GEMINI_API_KEY,
            "Content-Type": "application/json",
        }
        contents = []
        if historial:
            iniciado = False
            for turn in historial:
                if not iniciado and turn.role != "user":
                    continue
                iniciado = True
                role = "model" if turn.role == "assistant" else "user"
                contents.append({"role": role, "parts": [{"text": turn.content}]})
        contents.append({"role": "user", "parts": [{"text": user_message}]})

        body = {
            "system_instruction": {"parts": [{"text": full_system}]},
            "contents": contents,
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.2,
            },
        }
        resp = self.http.post(url, headers=headers, json=body, timeout=self.cfg.LLM_TIMEOUT_SECONDS)
        if resp.status_code != 200:
            snippet = resp.text[:200] if resp.text else ""
            raise RuntimeError(f"gemini HTTP {resp.status_code}: {snippet}")

        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]

    @staticmethod
    def _is_key_configured(key: str) -> bool:
        """Verifica que la API Key no esté vacía ni tenga el valor de ejemplo del .env."""
        cleaned = (key or "").strip()
        return bool(cleaned) and cleaned.lower() not in {"tu_api_key_aqui", "tu_token_aqui", "changeme"}

    def generar_estructurado(
        self,
        schema_cls: Type[T],
        system_prompt: str,
        user_message: str,
        historial: Optional[List[ChatTurn]] = None,
    ) -> T:
        """
        Recorre los proveedores configurados en LLM_PROVIDER_ORDER que tengan API Key activa
        y retorna la primera respuesta válida según `schema_cls`.
        Lanza `LLMUnavailableError` si todos fallan o ninguno tiene API Key.
        """
        full_system = system_prompt + self._build_schema_instruction(schema_cls)

        provider_map = {
            "openai": (self._is_key_configured(self.cfg.OPENAI_API_KEY), self._call_openai),
            "anthropic": (self._is_key_configured(self.cfg.ANTHROPIC_API_KEY), self._call_anthropic),
            "groq": (self._is_key_configured(self.cfg.GROQ_API_KEY), self._call_groq),
            "openrouter": (self._is_key_configured(self.cfg.OPENROUTER_API_KEY), self._call_openrouter),
            "gemini": (self._is_key_configured(self.cfg.GEMINI_API_KEY), self._call_gemini),
        }

        order = [p.strip().lower() for p in self.cfg.LLM_PROVIDER_ORDER.split(",") if p.strip()]
        activos = [(name, provider_map[name][1]) for name in order if name in provider_map and provider_map[name][0]]

        if not activos:
            logger.error(
                "Ningún proveedor LLM tiene API Key configurada (revisar GROQ_API_KEY, OPENROUTER_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY o ANTHROPIC_API_KEY)."
            )
            raise LLMUnavailableError("Sin proveedores LLM configurados.")

        errores: list[str] = []
        for provider_name, caller in activos:
            try:
                raw_json = caller(full_system, user_message, historial)
                cleaned_json = self._clean_json_text(raw_json)
                parsed_dict = json.loads(cleaned_json)
                flattened = self._flatten_nested_schema_values(parsed_dict)
                return schema_cls.model_validate(flattened)
            except (requests.RequestException, ValidationError, json.JSONDecodeError, KeyError, IndexError, ValueError, RuntimeError) as exc:
                logger.warning("Proveedor LLM '%s' falló (%s): %s", provider_name, type(exc).__name__, str(exc)[:200])
                errores.append(f"{provider_name}:{type(exc).__name__}")


        raise LLMUnavailableError(f"Todos los proveedores LLM activos fallaron ({', '.join(errores)}).")


llm_client = LLMClient()

