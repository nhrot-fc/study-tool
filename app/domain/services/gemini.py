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
        settings = get_settings()
        max_depth = settings.STUDY_PLAN_MAX_DEPTH

        system_instruction = """
        You are an expert study plan creator.
        Your goal is to create comprehensive and structured learning paths.
        """

        if existing_proposal:
            task_instruction = f"""
            ## Task
            The user wants to modify an existing study plan.
            Update the plan according to the instructions.

            ## Context
            Topic: {topic or message}
            User Instruction: {message}

            ## Current Plan
            {existing_proposal.model_dump_json(indent=2)}
            """
        else:
            task_instruction = f"""
            ## Task
            Generate a new study plan based on the topic and instructions.

            ## Context
            Topic: {topic or message}
            User Instruction: {message}
            """

        constraints = f"""
        ## Constraints
        1. **Output Format**:
            Return a single valid JSON object that strictly follows the provided schema.
        2. **Recursive Structure**:
            Sections can be nested. You may create subsections (children)
            up to a maximum depth of {max_depth} to organize the content logically.
        3. **Content**: Break down the topic into manageable sections.
        4. **Estimations**: Fill "duration_minutes" with realistic time estimates.

        ## JSON Schema
        {json.dumps(schema, indent=2)}
        """

        prompt = f"{system_instruction}\n\n{task_instruction}\n\n{constraints}"

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
