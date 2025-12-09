import json

from google import genai
from google.genai import types

from app.core.config import get_settings
from app.domain.schemas.study_plan import StudyPlanProposal


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

    def generate_json(self, prompt: str) -> str | None:
        """
        Generates JSON content based on the provided prompt.
        """
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        return response.text

    def generate_study_plan_proposal(
        self,
        message: str,
        topic: str | None = None,
        existing_proposal: StudyPlanProposal | None = None,
    ) -> StudyPlanProposal | None:
        schema = StudyPlanProposal.model_json_schema()

        if existing_proposal:
            prompt = f"""
            You are an expert study plan creator.
            The user wants to modify an existing study plan.

            Current Plan (JSON):
            {existing_proposal.model_dump_json(indent=2)}
            Topic/Context: {topic or message}
            User Instruction: {message}

            Update the study plan according to the user's instruction.
            Keep the structure valid according to the schema.

            Return a JSON object that strictly follows this JSON schema:
            {json.dumps(schema, indent=2)}
            """
        else:
            prompt = f"""
            Generate a study plan.
            Topic/Context: {topic or message}
            User Instruction: {message}

            Return a JSON object that strictly follows this JSON schema:
            {json.dumps(schema, indent=2)}

            Instructions for filling fields:
            - "notes": Provide brief study tips or key concepts to focus on
                        for this section if necessary.
            - "duration_minutes": Estimate the number of minutes to
                        complete this resource.

            Ensure the output is valid JSON and matches the structure.
            """

        response_text = self.generate_json(prompt)
        if not response_text:
            return None

        try:
            # Clean up potential markdown code blocks if Gemini adds them
            cleaned_text = response_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            elif cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]

            data = json.loads(cleaned_text)
            return StudyPlanProposal.model_validate(data)
        except Exception as e:
            print(f"Error parsing Gemini response: {e}")
            return None
