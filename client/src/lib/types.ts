// Types based on API schemas

export type ResourceType = 'video' | 'article' | 'book' | 'blog' | 'documentation' | 'repository';
export type CompletionStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
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
  url: string;
  type: ResourceType;
  description?: string | null;
  duration_minutes?: number | null;
}

export interface Resource extends ResourceCreate {
  id: string;
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
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  forked_from_id?: string | null;
}

export interface StudyPlanSummary extends StudyPlanBase {}

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

export interface GeneratePlanRequest {
  message: string;
  topic?: string;
  proposal?: StudyPlanProposal;
}

export interface StatusUpdate {
  status: CompletionStatus;
}
