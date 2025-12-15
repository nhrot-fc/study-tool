import json

from google import genai
from google.genai import types

from app.core.config import get_settings
from app.domain.schemas.quiz import QuizProposal
from app.domain.schemas.study_plan import StudyPlanProposal, StudyPlanReadDetail


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
        ignore_base_prompt: bool,
        ignore_proposal: bool,
        extra_instructions: str,
        proposal: StudyPlanProposal,
    ) -> StudyPlanProposal | None:
        schema = StudyPlanProposal.model_json_schema()
        settings = get_settings()
        max_depth = settings.STUDY_PLAN_MAX_DEPTH

        system_instruction = """
        You are a prestigious Academic Curriculum Designer
        specializing in higher education.
        Your task is to create structured, university-level study plans (syllabi).

        **Core Principles:**
        1. **Academic Rigor:** Base the structure and content on curricula
        from institutions (MIT, Oxford, Cambridge, ITMO, USP, Stanford).
        2. **Conciseness:** Be extremely brevity-oriented. Descriptions must be short,
        direct, and summary-style (like a course catalog).
        3. **Referencing:** Prioritize standard academic textbooks, papers,
        or recognized lectures in your references.
        """

        if ignore_base_prompt:
            system_instruction = ""

        if not ignore_proposal:
            task_instruction = f"""
            ## Task
            The user wants to modify the existing study plan.
            Maintain the academic structure, strict brevity, and reference style.
            ## Current Plan (To be modified)
            {proposal.model_dump_json(indent=2)}
            """
        else:
            task_instruction = """
            ## Task
            Generate a study plan based on the user's request.
            """

        if extra_instructions:
            task_instruction += f"""
            ## Context / Additional Instructions
            {extra_instructions}
            """

        constraints = f"""
        ## Constraints & Formatting Rules
        1. **Output Format**:
            Return a single valid JSON object strictly following the provided schema.

        2. **Description Style (CRITICAL)**:
            - Keep descriptions **under 40 words**.
            - Use active verbs and technical terminology.
            - Avoid "fluff" phrases like "In this section we will learn about...".
            Instead use: "Analysis of [Topic] covering [Concept A] and [Concept B]."

        3. **Structure**:
            - Nest sections logically up to a maximum depth of {max_depth}.
            - Ensure a logical progression (e.g., Foundations ->
            Core Concepts -> Advanced Applications).

        4. **References**:
            - Where applicable in the schema, suggest real,
            verifiable academic sources (books with authors, seminal papers,
            or specific university course codes like 'MIT 6.006').

        5. **Estimations**: "duration_minutes" must be realistic
        for university-level study sessions.

        ## JSON Schema
        {json.dumps(schema, indent=2)}
        """

        prompt = f"{system_instruction}\n\n{task_instruction}\n\n{constraints}"
        response_text = self.generate_json(prompt)

        if not response_text:
            return None

        try:
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

    def generate_quiz_proposal(
        self,
        ignore_base_prompt: bool,
        study_plan: StudyPlanReadDetail,
        extra_instructions: str,
        num_questions: int,
        difficulty: float,
    ) -> QuizProposal | None:
        schema = QuizProposal.model_json_schema()

        sections_context = f"""## Curriculum Description:
        {study_plan.model_dump_json(indent=2)}
        """

        if difficulty < 4.0:
            cognitive_focus = """Focus primarily on **Recall** (definitions, facts)
            and **Comprehension** (explaining concepts)."""
        elif difficulty < 7.0:
            cognitive_focus = """Focus on **Application**
            (solving problems, using formulas) and
            **Analysis** (comparing components, identifying errors)."""
        else:
            cognitive_focus = """Focus on **Evaluation**
            and **Synthesis** (complex scenarios,
            multi-step deduction, critical judgement)."""

        system_instruction = """
        You are a strict University Examination Board creating a final exam.
        Your goal is to assess student mastery through objective,
        precise multiple-choice questions.
        **Design Philosophy:**
        1. **Objectivity:** Every question can have multiple correct answers.
        Avoid opinions or vague "implications".
        2. **Bloom's Taxonomy:** Adhere to the requested cognitive complexity
        (Recall vs. Analysis).
        3. **Distractors:** Wrong options must be plausible errors
        (common misconceptions), not obviously fake or silly answers.
        4. **Format:** Use standard academic stems: "Calculate...", "Identify...",
        "Which of the following describes...", "Analyze the relationship between...".
        """
        if ignore_base_prompt:
            system_instruction = ""

        task_instruction = f"""
        ## Task
        Generate a {num_questions}-question quiz for the following Study Plan.

        ## Difficulty Calibration
        Target Difficulty: {difficulty}/10.0
        Instruction: {cognitive_focus}

        ## Study Plan Scope (Source Material)
        **Topic:** {study_plan.title}
        **Detailed Curriculum:**
        {sections_context}
        """

        if extra_instructions:
            task_instruction += f"""
            ## Additional User Constraints
            {extra_instructions}
            """

        constraints = f"""
        ## Constraints & Strict Formatting
        1. **Output**: Return a single valid JSON object matching the schema.
        2. **Question Structure**:
            - **Stem**: The question text must be self-contained. Avoid "What about X?".
            Instead use "Given condition Y, what is the value of X?"
            - **Options**: Provide exactly 5 options per question.
            - Multiple Correct answers are allowed.
        3. **Content Rules**:
            - **No Open-Endedness**: Do not ask "What are the benefits of...".
            Ask "Which of the following is a primary benefit of... according to X?"
            - **Scenarios**: For high difficulty, use small case studies
            or code snippets (if technical) in the description.
        ## JSON Schema
        {json.dumps(schema, indent=2)}
        """

        prompt = f"{system_instruction}\n\n{task_instruction}\n\n{constraints}"

        response_text = self.generate_json(prompt)
        if not response_text:
            return None

        try:
            cleaned_text = response_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            elif cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]

            data = json.loads(cleaned_text)
            return QuizProposal.model_validate(data)
        except Exception as e:
            print(f"Error parsing Gemini response: {e}")
            return None
