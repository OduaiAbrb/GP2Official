"""Google Gemini provider."""

from google import genai
from google.genai import types as genai_types
import json
from typing import Dict, Any
from .base_provider import BaseAIProvider
from config import settings


class GeminiProvider(BaseAIProvider):
    """Google Gemini provider."""

    def __init__(self):
        self.api_key = settings.gemini_api_key
        self._client = genai.Client(api_key=self.api_key) if self.api_key else None

    async def generate_text(self, prompt: str, **kwargs) -> str:
        """Generate text using Gemini."""
        if not self.is_available:
            raise ValueError("Gemini API key not configured")

        response = await self._client.aio.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
        )
        return response.text

    async def generate_structured(self, prompt: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        """Generate structured data."""
        enhanced_prompt = f"{prompt}\n\nRespond with valid JSON matching this schema: {json.dumps(schema)}"
        text = await self.generate_text(enhanced_prompt)
        return json.loads(text)

    @property
    def name(self) -> str:
        return "gemini"

    @property
    def is_available(self) -> bool:
        return bool(self.api_key)
