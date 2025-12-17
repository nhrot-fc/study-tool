import json

from app.domain.schemas.study_plan import StudyPlanProposal

if __name__ == "__main__":
    schema = StudyPlanProposal.model_json_schema()
    print(json.dumps(schema, indent=2))
