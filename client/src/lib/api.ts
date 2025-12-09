import type {
    AuthToken,
    LoginRequest,
    RegisterRequest,
    User,
    StudyPlan,
    GeneratePlanRequest,
    StudyPlanProposal
} from './types';

const API_BASE_URL = 'http://localhost:8000/api';

class APIClient {
    private token: string | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('access_token');
        }
    }

    setToken(token: string) {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', token);
        }
    }

    clearToken() {
        this.token = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        }
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const headers = new Headers(options.headers);

        if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }

        if (this.token) {
            headers.set('Authorization', `Bearer ${this.token}`);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            if (response.status === 401) {
                this.clearToken();
            }
            const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
            throw new Error(error.detail || 'API request failed');
        }

        return response.json();
    }

    async login(credentials: LoginRequest): Promise<AuthToken> {
        const token = await this.request<AuthToken>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        this.setToken(token.access_token);
        return token;
    }

    async register(data: RegisterRequest): Promise<User> {
        return this.request<User>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getCurrentUser(): Promise<User> {
        return this.request<User>('/users/me');
    }

    async logout(): Promise<void> {
        await this.request('/auth/logout', { method: 'POST' });
        this.clearToken();
    }

    async getStudyPlans(): Promise<StudyPlan[]> {
        return this.request<StudyPlan[]>('/plans');
    }

    async getStudyPlan(id: string): Promise<StudyPlan> {
        return this.request<StudyPlan>(`/plans/${id}`);
    }

    async createStudyPlan(plan: Omit<StudyPlan, 'id' | 'created_at' | 'updated_at'>): Promise<StudyPlan> {
        return this.request<StudyPlan>('/plans', {
            method: 'POST',
            body: JSON.stringify(plan),
        });
    }

    async generatePlanWithAI(request: GeneratePlanRequest): Promise<StudyPlanProposal> {
        return this.request<StudyPlanProposal>('/plans/generate', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    async refinePlanWithAI(request: GeneratePlanRequest): Promise<StudyPlanProposal> {
        return this.request<StudyPlanProposal>('/plans/refine', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    async searchUsers(query: string): Promise<User[]> {
        return this.request<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
    }

    async forkPlan(planId: string): Promise<StudyPlan> {
        return this.request<StudyPlan>(`/plans/${planId}/fork`, {
            method: 'POST',
        });
    }
}

export const apiClient = new APIClient();
