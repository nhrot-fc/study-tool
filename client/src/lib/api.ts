import type {
  AuthToken,
  LoginRequest,
  RegisterRequest,
  User,
  StudyPlan,
  StudyPlanSummary,
  StudyPlanWithProgress,
  GeneratePlanRequest,
  StudyPlanProposal,
  StudyPlanCreate,
  StudyPlanUpdate,
  ResourceProgress,
  StatusUpdate,
} from "./types";

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

const API_BASE_URL = "http://localhost:8000/api/v1";

class APIClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("access_token");
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers = new Headers(options.headers);

    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
      }

      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: "An error occurred" };
      }

      let message = "API request failed";
      if (errorData.detail) {
        if (typeof errorData.detail === "string") {
          message = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          // Handle FastAPI validation errors
          message = errorData.detail
            .map((err: any) => {
              const field = err.loc ? err.loc[err.loc.length - 1] : "Field";
              return `${field}: ${err.msg}`;
            })
            .join(", ");
        }
      }

      throw new ApiError(response.status, message, errorData);
    }

    return response.json();
  }

  async login(credentials: LoginRequest): Promise<AuthToken> {
    const token = await this.request<AuthToken>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    this.setToken(token.access_token);
    return token;
  }

  async register(data: RegisterRequest): Promise<User> {
    return this.request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  async logout(): Promise<void> {
    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem("refresh_token")
        : null;
    if (refreshToken) {
      try {
        await this.request("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch (e) {
        console.error("Logout failed", e);
      }
    }
    this.clearToken();
  }

  async getStudyPlans(userId: string): Promise<StudyPlanSummary[]> {
    return this.request<StudyPlanSummary[]>(`/plan/user/${userId}`);
  }

  async getStudyPlan(id: string): Promise<StudyPlanWithProgress> {
    return this.request<StudyPlanWithProgress>(`/plan/${id}`);
  }

  async createStudyPlan(plan: StudyPlanCreate): Promise<StudyPlan> {
    return this.request<StudyPlan>("/plan", {
      method: "POST",
      body: JSON.stringify(plan),
    });
  }

  async updateStudyPlan(
    id: string,
    plan: StudyPlanUpdate,
  ): Promise<StudyPlan> {
    return this.request<StudyPlan>(`/plan/${id}`, {
      method: "PUT",
      body: JSON.stringify(plan),
    });
  }

  async generatePlanWithAI(
    request: GeneratePlanRequest,
  ): Promise<StudyPlanProposal> {
    return this.request<StudyPlanProposal>("/plan/generate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async refinePlanWithAI(
    request: GeneratePlanRequest,
  ): Promise<StudyPlanProposal> {
    return this.request<StudyPlanProposal>("/plan/generate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.request<User[]>(
      `/users/?username=${encodeURIComponent(query)}`,
    );
  }

  async getUser(userId: string): Promise<User> {
    return this.request<User>(`/users/${userId}`);
  }

  async forkPlan(planId: string): Promise<StudyPlan> {
    return this.request<StudyPlan>(`/plan/${planId}/fork`, {
      method: "POST",
    });
  }

  async updateResourceStatus(
    studyPlanId: string,
    sectionId: string,
    resourceId: string,
    status: StatusUpdate["status"],
  ): Promise<ResourceProgress> {
    return this.request<ResourceProgress>(
      `/progress/plan/${studyPlanId}/sections/${sectionId}/resources/${resourceId}/status`,
      {
        method: "POST",
        body: JSON.stringify({ status }),
      },
    );
  }
}

export const apiClient = new APIClient();
