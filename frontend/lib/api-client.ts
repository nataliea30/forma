// Clean API client for frontend - no secrets, only API calls
import type { User, ProgressEntry } from './auth'
import { getFrontendConfig } from './config'

export interface PoseAnalysisData {
  exercise: string
  landmarks: Array<{ x: number; y: number; z: number; visibility: number }>
  formIssues: string[]
  currentPhase?: string
}

export interface MastraResponse {
  suggestions: string[]
  warnings: string[]
  encouragement?: string
  technicalExplanation?: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  success?: boolean
}

class ApiClient {
  private baseUrl: string
  private authToken?: string

  constructor() {
    const config = getFrontendConfig()
    this.baseUrl = config.app.apiUrl

    // Load persisted token on client (if present)
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('pt_app_token')
      if (stored) {
        this.authToken = stored
      }
    }
  }

  setToken(token: string | null) {
    if (typeof window !== 'undefined') {
      if (token) {
        window.localStorage.setItem('pt_app_token', token)
        this.authToken = token
      } else {
        window.localStorage.removeItem('pt_app_token')
        this.authToken = undefined
      }
    } else {
      this.authToken = token ?? undefined
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> | undefined),
      }
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`
      }

      const response = await fetch(url, {
        headers,
        ...options,
      })

      const responseData = await response.json()

      if (!response.ok) {
        return { error: responseData.error || 'Request failed' }
      }

      // Handle backend response format: { success: true, data: {...} }
      if (responseData.success && responseData.data) {
        return { data: responseData.data, success: true }
      }

      // Fallback for other response formats
      return { data: responseData, success: true }
    } catch (error) {
      console.error(`[API Client] Request failed for ${endpoint}:`, error)
      return { error: 'Network error' }
    }
  }

  // Authentication APIs
  async signIn(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async signUp(
    email: string,
    password: string,
    name: string,
    role: 'healthcare_provider' | 'patient',
    additionalData?: any
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role, additionalData }),
    })
  }

  async signOut(): Promise<ApiResponse<{ success: boolean }>> {
    return this.request('/auth/signout', {
      method: 'POST',
    })
  }

  // User Profile APIs
  async getUserProfile(userId: string): Promise<ApiResponse<{ user: User }>> {
    return this.request('/users/profile', {
      method: 'GET',
      headers: {
        'x-user-id': userId,
      },
    })
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<User>
  ): Promise<ApiResponse<{ success: boolean }>> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ userId, updates }),
    })
  }

  // Pose Analysis API
  async analyzePose(analysisData: PoseAnalysisData): Promise<ApiResponse<MastraResponse>> {
    return this.request('/analyze-pose', {
      method: 'POST',
      body: JSON.stringify(analysisData),
    })
  }

  // Progress Tracking APIs
  async saveProgress(progressData: Omit<ProgressEntry, 'id'>): Promise<ApiResponse<{ progress: ProgressEntry }>> {
    return this.request('/progress/save', {
      method: 'POST',
      body: JSON.stringify(progressData),
    })
  }

  async getPatientProgress(patientId: string): Promise<ApiResponse<{ progress: ProgressEntry[] }>> {
    return this.request(`/progress/patient/${patientId}`, {
      method: 'GET',
    })
  }

  // Patient-Provider Connection APIs
  async connectPatientToProvider(
    patientId: string,
    providerId: string
  ): Promise<ApiResponse<{ connection: any }>> {
    return this.request('/connections', {
      method: 'POST',
      body: JSON.stringify({ patientId, providerId }),
    })
  }

  async getPatientConnections(patientId: string): Promise<ApiResponse<{ connections: any[] }>> {
    return this.request(`/connections/patient/${patientId}`, {
      method: 'GET',
    })
  }

  async getProviderConnections(providerId: string): Promise<ApiResponse<{ connections: any[] }>> {
    return this.request(`/connections/provider/${providerId}`, {
      method: 'GET',
    })
  }

  // User search (server-backed)
  async searchUsers(role: 'patient' | 'healthcare_provider', query: string): Promise<ApiResponse<{ users: User[] }>> {
    const params = new URLSearchParams({ role, query })
    return this.request(`/users/search?${params.toString()}`, {
      method: 'GET',
    })
  }

  // GPT Chat (backend-proxied to OpenAI)
  async gptChat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    opts?: { model?: string; temperature?: number }
  ): Promise<ApiResponse<{ reply: string }>> {
    return this.request('/gpt/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, ...(opts || {}) }),
    })
  }
}
 
// Export singleton instance
export const apiClient = new ApiClient()
