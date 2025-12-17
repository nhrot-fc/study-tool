import json
from logging import getLogger
from typing import Any

from google import genai
from google.genai import types

from app.core.config import get_settings
from app.domain.enums import ResourceType
from app.domain.schemas.quiz import QuizProposal
from app.domain.schemas.study_plan import StudyPlanProposal, StudyPlanReadDetail


class GeminiService:
    def __init__(self):
        settings = get_settings()
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model = "gemini-2.5-flash"
        self.logger = getLogger("app.domain.services.gemini.GeminiService")

    def generate_json(
        self, prompt: str, schema: dict[str, Any] | None = None
    ) -> str | None:
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json", response_json_schema=schema
            ),
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

        system_instruction = f"""
        ### ROLE
        Act as a High-Density Knowledge Retrieval Engine.
        Your goal is to construct technical study paths based on
        strict curation standards.

        ### CORE DIRECTIVES
        1. **ZERO FILLER:** Do not use phrases like "Advanced," "Rigorous"
        2. **STYLE:** Telegraphic, objective, dry.
        Mimic an advanced search index or a curated bibliography.
        3. **DEPTH:** Focus on "How things work" (Internals)
        and "Real-world scale" (Case Studies).

        ### RESOURCE HIERARCHY (STRICT PRIORITY)
        You must aggregate resources from these three tiers:
        * **TIER 1 (Foundations):** Standard Academic Textbooks,
        Papers, University Curricula (MIT, Stanford, CMU, ETH Zurich).
        * **TIER 2 (Applied Engineering):** Official Engineering Blogs
        (Meta, Discord, Netflix, Uber, Cloudflare), Post-Mortems, RFCs, and Whitepapers.
        * **TIER 3 (Expertise):** Content from recognized engineers
        (e.g., Martin Fowler, reputable personal blogs) and
        high-quality documentation/platforms (mdn, roadmap.sh).

        ### OUTPUT FORMAT
        For every topic requested, strictly follow this structure:

        ## [MODULE NAME]
        **Core Concept:** [1-sentence definition, technical precision only]
        **Curriculum:**
        * [Subtopic 1]: [Brief scope]
        * [Subtopic 2]: [Brief scope]

        **Retrieval Index (Resources):**
        * [TYPE: book] :: [Title/University] - [Specific Chapters/Lectures]
        * [TYPE: blog] :: [Company/Blog Title] - [Key takeaway e.g.,
        "How Discord scaled Elixir"]
        * [TYPE: paper] :: [Title/Author]
        ## Available Resource Types: {list(ResourceType)}

        ### NEGATIVE CONSTRAINTS
        * NO fluff descriptions ("This is a very important topic...").
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
            return StudyPlanProposal.model_validate_json(response_text)
        except Exception as e:
            self.logger.error(f"Error parsing Gemini response: {e}")
            self.logger.error(f"Response Text: {response_text}")
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
            - **Format**: Use LaTeX for mathematical expressions and snippets for code.
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

        response_text = self.generate_json(prompt, schema)

        if not response_text:
            return None

        try:
            return QuizProposal.model_validate_json(response_text)
        except Exception as e:
            self.logger.error(f"Error parsing Gemini response: {e}")
            self.logger.error(f"Response Text: {response_text}")
            return None
