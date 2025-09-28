import axios, { AxiosInstance } from 'axios'
import { config } from '@/config/environment'
import { logger } from '@/utils/logger'

export interface CedarOSSession {
  id: string
  userId: string
  exerciseType: string
  startTime: Date
  endTime?: Date
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  metadata: Record<string, any>
}

export interface CedarOSAnalysis {
  sessionId: string
  timestamp: Date
  landmarks: Array<{
    x: number
    y: number
    z: number
    visibility: number
  }>
  formScore: number
  phase: string
  issues: string[]
  suggestions: string[]
  warnings: string[]
}

export interface CedarOSProgress {
  sessionId: string
  userId: string
  exerciseType: string
  totalReps: number
  averageFormScore: number
  totalDuration: number
  improvements: string[]
  concerns: string[]
  completedAt: Date
}

export class CedarOSService {
  private client: AxiosInstance
  private isConnected: boolean = false

  constructor() {
    this.client = axios.create({
      baseURL: config.cedaros.apiUrl,
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${config.cedaros.apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`CedarOS API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        logger.error('CedarOS API Request Error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`CedarOS API Response: ${response.status} ${response.config.url}`)
        return response
      },
      (error) => {
        logger.error('CedarOS API Response Error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  async connect(): Promise<boolean> {
    try {
      const response = await this.client.get('/health')
      this.isConnected = response.status === 200
      
      if (this.isConnected) {
        logger.info('✅ CedarOS connection established')
      } else {
        logger.warn('⚠️ CedarOS connection failed')
      }
      
      return this.isConnected
    } catch (error) {
      logger.error('❌ CedarOS connection error:', error)
      this.isConnected = false
      return false
    }
  }

  async createSession(sessionData: Omit<CedarOSSession, 'id' | 'startTime'>): Promise<CedarOSSession> {
    try {
      const response = await this.client.post('/sessions', {
        ...sessionData,
        startTime: new Date().toISOString(),
      })

      const session: CedarOSSession = {
        id: response.data.id,
        startTime: new Date(response.data.startTime),
        ...response.data,
      }

      logger.info(`CedarOS session created: ${session.id}`)
      return session
    } catch (error) {
      logger.error('Failed to create CedarOS session:', error)
      throw new Error('Failed to create CedarOS session')
    }
  }

  async updateSession(sessionId: string, updates: Partial<CedarOSSession>): Promise<CedarOSSession> {
    try {
      const response = await this.client.patch(`/sessions/${sessionId}`, updates)
      
      logger.debug(`CedarOS session updated: ${sessionId}`)
      return response.data
    } catch (error) {
      logger.error(`Failed to update CedarOS session ${sessionId}:`, error)
      throw new Error('Failed to update CedarOS session')
    }
  }

  async endSession(sessionId: string): Promise<CedarOSSession> {
    try {
      const response = await this.client.patch(`/sessions/${sessionId}`, {
        status: 'completed',
        endTime: new Date().toISOString(),
      })

      logger.info(`CedarOS session ended: ${sessionId}`)
      return response.data
    } catch (error) {
      logger.error(`Failed to end CedarOS session ${sessionId}:`, error)
      throw new Error('Failed to end CedarOS session')
    }
  }

  async analyzePose(sessionId: string, landmarks: any[]): Promise<CedarOSAnalysis> {
    try {
      const response = await this.client.post('/analyze', {
        sessionId,
        landmarks,
        timestamp: new Date().toISOString(),
      })

      const analysis: CedarOSAnalysis = {
        sessionId,
        timestamp: new Date(response.data.timestamp),
        landmarks: response.data.landmarks,
        formScore: response.data.formScore,
        phase: response.data.phase,
        issues: response.data.issues,
        suggestions: response.data.suggestions,
        warnings: response.data.warnings,
      }

      logger.debug(`CedarOS pose analysis completed for session: ${sessionId}`)
      return analysis
    } catch (error) {
      logger.error(`Failed to analyze pose for session ${sessionId}:`, error)
      throw new Error('Failed to analyze pose')
    }
  }

  async getSessionProgress(sessionId: string): Promise<CedarOSProgress> {
    try {
      const response = await this.client.get(`/sessions/${sessionId}/progress`)
      
      const progress: CedarOSProgress = {
        sessionId,
        userId: response.data.userId,
        exerciseType: response.data.exerciseType,
        totalReps: response.data.totalReps,
        averageFormScore: response.data.averageFormScore,
        totalDuration: response.data.totalDuration,
        improvements: response.data.improvements,
        concerns: response.data.concerns,
        completedAt: new Date(response.data.completedAt),
      }

      return progress
    } catch (error) {
      logger.error(`Failed to get progress for session ${sessionId}:`, error)
      throw new Error('Failed to get session progress')
    }
  }

  async getUserSessions(userId: string, limit: number = 50): Promise<CedarOSSession[]> {
    try {
      const response = await this.client.get(`/users/${userId}/sessions`, {
        params: { limit }
      })

      return response.data.sessions.map((session: any) => ({
        id: session.id,
        userId: session.userId,
        exerciseType: session.exerciseType,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined,
        status: session.status,
        metadata: session.metadata,
      }))
    } catch (error) {
      logger.error(`Failed to get sessions for user ${userId}:`, error)
      throw new Error('Failed to get user sessions')
    }
  }

  async getConnectionStatus(): Promise<boolean> {
    return this.isConnected
  }

  // Fallback methods for when CedarOS is not available
  async createFallbackSession(sessionData: Omit<CedarOSSession, 'id' | 'startTime'>): Promise<CedarOSSession> {
    const session: CedarOSSession = {
      id: `fallback_${Date.now()}`,
      startTime: new Date(),
      ...sessionData,
    }

    logger.warn(`Created fallback CedarOS session: ${session.id}`)
    return session
  }

  async analyzePoseFallback(sessionId: string, landmarks: any[]): Promise<CedarOSAnalysis> {
    // Simple fallback analysis
    const analysis: CedarOSAnalysis = {
      sessionId,
      timestamp: new Date(),
      landmarks,
      formScore: 75, // Default score
      phase: 'active',
      issues: [],
      suggestions: ['Keep up the good work!'],
      warnings: [],
    }

    logger.warn(`Using fallback CedarOS analysis for session: ${sessionId}`)
    return analysis
  }
}

// Export singleton instance
export const cedarOSService = new CedarOSService()
