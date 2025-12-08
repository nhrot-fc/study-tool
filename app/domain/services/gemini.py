from google import genai
from google.genai import types

from app.core.config import get_settings


class GeminiService:
    def __init__(self):
        settings = get_settings()
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model = "gemini-2.5-flash"

    def generate_content(self, prompt: str) -> str | None:
        """
        Generates content based on the provided prompt using the Gemini model.
        """
        response = self.client.models.generate_content(
            model=self.model, contents=prompt
        )
        return response.text

    def generate_content_with_config(
        self, prompt: str, temperature: float = 1.0
    ) -> str | None:
        """
        Generates content with specific configuration (e.g., temperature).
        """
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(temperature=temperature),
        )
        return response.text
