// Types based on API schemas

export type ResourceType = 'video' | 'article' | 'book' | 'blog' | 'documentation' | 'repository' | 'other';
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

export interface Resource {
  id?: string;
  title: string;
  url: string;
  type: ResourceType;
  description?: string;
  duration_minutes?: number | null;
}

export interface Section {
  id?: string;
  title: string;
  description?: string;
  order: number;
  notes?: string | null;
  status?: CompletionStatus;
  progress?: number;
  resources: Resource[];
  children: Section[];
}

export interface StudyPlan {
  id?: string;
  title: string;
  description: string;
  created_at?: string;
  updated_at?: string;
  forked_from_id?: string | null;
  sections: Section[];
  resources: Resource[];
}

export interface StudyPlanProposal {
  title: string;
  description: string;
  sections: Section[];
  resources: Resource[];
}

export interface StudyPlanCreate extends StudyPlanProposal {
  user_id: string;
}

export interface GeneratePlanRequest {
  message: string;
  topic?: string;
  proposal?: StudyPlanProposal;
}
