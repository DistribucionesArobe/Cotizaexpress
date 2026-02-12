from dataclasses import dataclass
from typing import Any, Optional

@dataclass
class UserMessage:
    content: str

class LlmChat:
    """
    Stub local para desarrollo.
    Simula la interfaz mínima que usa el proyecto.
    """
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        self.provider: Optional[str] = None
        self.model: Optional[str] = None
        self.api_key: Optional[str] = None

    def with_model(self, provider: str, model: str) -> "LlmChat":
        self.provider = provider
        self.model = model
        return self

    def with_api_key(self, api_key: str) -> "LlmChat":
        self.api_key = api_key
        return self

    async def complete(self, *args: Any, **kwargs: Any) -> Any:
        return {"text": "stub-response"}
