// Types based on API schemas

export type ResourceType =
  | "video"
  | "paper"
  | "article"
  | "book"
  | "blog"
  | "documentation"
  | "repository";
export type CompletionStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "skipped";

export interface User {
  id: string;
  email: string;
  username: string;
  active: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthToken {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ResourceCreate {
  title: string;
  type: ResourceType;
  url?: string;
  description?: string | null;
  duration_minutes?: number | null;
}

export interface Resource extends ResourceCreate {
  id: string;
  status?: CompletionStatus;
}

export interface SectionCreate {
  title: string;
  description?: string | null;
  order: number;
  resources: ResourceCreate[];
  children: SectionCreate[];
}

export interface Section {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  resources: Resource[];
  children: Section[];
  status?: CompletionStatus;
  progress?: number;
}

export interface ResourceProgress {
  id: string;
  resource_id: string;
  section_progress_id: string;
  status: CompletionStatus;
  completed_at?: string | null;
}

export interface SectionProgress {
  id: string;
  section_id: string;
  study_plan_progress_id: string;
  status: CompletionStatus;
  progress: number;
  completed_at?: string | null;
  resource_progresses: ResourceProgress[];
}

export interface StudyPlanProgress {
  id: string;
  study_plan_id: string;
  user_id: string;
  status: CompletionStatus;
  progress: number;
  completed_at?: string | null;
  section_progresses: SectionProgress[];
}

export interface StudyPlanBase {
  id: string;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  forked_from_id?: string | null;
}

export type StudyPlanSummary = StudyPlanBase;

export interface StudyPlan extends StudyPlanBase {
  sections: Section[];
  resources: Resource[];
}

export interface StudyPlanWithProgress extends StudyPlan {
  progress?: StudyPlanProgress | null;
}

export interface StudyPlanProposal {
  title: string;
  description: string;
  sections: SectionCreate[];
  resources: ResourceCreate[];
}

export interface StudyPlanCreate extends StudyPlanProposal {
  user_id: string;
}

export interface StudyPlanGenerateRequest {
  ignore_base_prompt: boolean;
  ignore_proposal: boolean;
  extra_instructions: string;
  proposal: StudyPlanProposal;
}

export interface StatusUpdate {
  status: CompletionStatus;
}

export interface ResourceUpsert extends ResourceCreate {
  id?: string | null;
}

export interface SectionUpsert {
  id?: string | null;
  title: string;
  description?: string | null;
  order: number;
  resources: ResourceUpsert[];
  children: SectionUpsert[];
}

export interface StudyPlanUpdate {
  title?: string | null;
  description?: string | null;
  sections?: SectionUpsert[] | null;
}

export interface QuestionOptionBase {
  text: string;
  is_correct: boolean;
}

export type QuestionOptionCreate = QuestionOptionBase;

export interface QuestionOptionRead extends QuestionOptionBase {
  id: string;
}

export interface QuestionOptionPublic {
  id: string;
  text: string;
}

export interface QuestionBase {
  title: string;
  description: string;
  order: number;
}

export interface QuestionCreate extends QuestionBase {
  options: QuestionOptionCreate[];
}

export interface QuestionRead extends QuestionBase {
  id: string;
  options: QuestionOptionRead[];
  correct_answer_count: number;
}

export interface QuestionPublic extends QuestionBase {
  id: string;
  options: QuestionOptionPublic[];
  correct_answer_count: number;
}

export interface QuizBase {
  title: string;
  difficulty: number;
  duration_minutes: number;
}

export interface QuizProposal extends QuizBase {
  questions: QuestionCreate[];
}

export interface QuizCreate extends QuizProposal {
  study_plan_id: string;
  user_id: string;
}

export interface QuizRead extends QuizBase {
  id: string;
  study_plan_id: string;
  user_id: string;
  started_at?: string | null;
  completed_at?: string | null;
  score?: number | null;
  is_expired?: boolean;
}

export interface QuizUserAnswerRead {
  question_id: string;
  selected_option_id: string;
}

export interface QuizReadDetail extends QuizRead {
  questions: QuestionRead[];
  user_answers: QuizUserAnswerRead[];
}

export interface QuizReadPublic extends QuizRead {
  questions: QuestionPublic[];
}

export interface QuestionUserSelectedOptions {
  question_id: string;
  selected_option_id: string;
}

export interface QuizSubmission {
  answers: QuestionUserSelectedOptions[];
}

export interface QuizResult extends QuizRead {
  total_questions: number;
  correct_answers: number;
  passed: boolean;
}

export interface QuizGenerateRequest {
  ignore_base_prompt: boolean;
  study_plan: StudyPlan;
  num_questions: number;
  difficulty: number;
  extra_instructions: string;
}
