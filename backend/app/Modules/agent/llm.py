import json
import logging
from typing import List, Optional, Type, TypeVar
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

    def __init__(self, cfg: Settings = settings, http_session: Optional[requests.Session] = None):
        self.cfg = cfg
        self.http = http_session or requests.Session()

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
    def _build_schema_instruction(schema_cls: Type[BaseModel]) -> str:
        """Genera la instrucción de esquema JSON a partir del modelo Pydantic."""
        schema_dict = schema_cls.model_json_schema()
        properties = schema_dict.get("properties", {})
        campos_desc = {
            k: {
                "type": v.get("type", v.get("anyOf", "any")),
                "description": v.get("description", ""),
            }
            for k, v in properties.items()
        }
        return (
            "\n\nIMPORTANTE: Respondé EXCLUSIVAMENTE con un objeto JSON válido (sin texto adicional ni bloques markdown) "
            "que respete exactamente los siguientes campos:\n"
            f"{json.dumps(campos_desc, ensure_ascii=False, indent=2)}"
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

    def _call_groq(
        self,
        full_system: str,
        user_message: str,
        historial: Optional[List[ChatTurn]],
    ) -> str:
        return self._call_openai_compatible(
            provider_name="groq",
            url="https://api.groq.com/openai/v1/chat/completions",
            api_key=self.cfg.GROQ_API_KEY,
            model=self.cfg.GROQ_MODEL,
            full_system=full_system,
            user_message=user_message,
            historial=historial,
        )

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
            "openai": (bool(self.cfg.OPENAI_API_KEY), self._call_openai),
            "anthropic": (bool(self.cfg.ANTHROPIC_API_KEY), self._call_anthropic),
            "groq": (bool(self.cfg.GROQ_API_KEY), self._call_groq),
            "gemini": (bool(self.cfg.GEMINI_API_KEY), self._call_gemini),
        }

        order = [p.strip().lower() for p in self.cfg.LLM_PROVIDER_ORDER.split(",") if p.strip()]
        activos = [(name, provider_map[name][1]) for name in order if name in provider_map and provider_map[name][0]]

        if not activos:
            logger.error(
                "Ningún proveedor LLM tiene API Key configurada (revisar OPENAI_API_KEY, ANTHROPIC_API_KEY, GROQ_API_KEY o GEMINI_API_KEY)."
            )
            raise LLMUnavailableError("Sin proveedores LLM configurados.")

        errores: list[str] = []
        for provider_name, caller in activos:
            try:
                raw_json = caller(full_system, user_message, historial)
                cleaned_json = self._clean_json_text(raw_json)
                return schema_cls.model_validate_json(cleaned_json)
            except (requests.RequestException, ValidationError, KeyError, IndexError, ValueError, RuntimeError) as exc:
                logger.warning("Proveedor LLM '%s' falló (%s): %s", provider_name, type(exc).__name__, str(exc)[:200])
                errores.append(f"{provider_name}:{type(exc).__name__}")

        raise LLMUnavailableError(f"Todos los proveedores LLM activos fallaron ({', '.join(errores)}).")


llm_client = LLMClient()

