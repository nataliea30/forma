import axios, { AxiosInstance } from 'axios'
import { config } from '@/config/environment'
import { logger } from '@/utils/logger'

export interface MastraAnalysisRequest {
  exercise: string
  landmarks: Array<{
    x: number
    y: number
    z: number
    visibility: number
  }>
  formIssues: string[]
  currentPhase?: string
  sessionContext?: {
    sessionId: string
    userId: string
    previousAnalyses?: any[]
  }
}

export interface MastraResponse {
  suggestions: string[]
  warnings: string[]
  encouragement?: string
  technicalExplanation?: string
  confidence: number
  nextSteps?: string[]
  riskAssessment?: {
    level: 'low' | 'medium' | 'high'
    factors: string[]
  }
}

export interface MastraCoachingSession {
  id: string
  userId: string
  exerciseType: string
  startTime: Date
  endTime?: Date
  totalAnalyses: number
  averageConfidence: number
  improvements: string[]
  persistentIssues: string[]
  coachingHistory: Array<{
    timestamp: Date
    type: 'suggestion' | 'warning' | 'encouragement'
    message: string
    confidence: number
  }>
}

export class MastraService {
  private client: AxiosInstance
  private isConnected: boolean = false
  private coachingSessions: Map<string, MastraCoachingSession> = new Map()

  constructor() {
    this.client = axios.create({
      baseURL: config.mastra.apiUrl,
      timeout: 15000,
      headers: {
        'Authorization': `Bearer ${config.mastra.apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Mastra API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        logger.error('Mastra API Request Error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Mastra API Response: ${response.status} ${response.config.url}`)
        return response
      },
      (error) => {
        logger.error('Mastra API Response Error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  async connect(): Promise<boolean> {
    try {
      const response = await this.client.get('/health')
      this.isConnected = response.status === 200
      
      if (this.isConnected) {
        logger.info('✅ Mastra connection established')
      } else {
        logger.warn('⚠️ Mastra connection failed')
      }
      
      return this.isConnected
    } catch (error) {
      logger.error('❌ Mastra connection error:', error)
      this.isConnected = false
      return false
    }
  }

  async analyzePose(request: MastraAnalysisRequest): Promise<MastraResponse> {
    try {
      const response = await this.client.post('/analyze/pose', {
        ...request,
        timestamp: new Date().toISOString(),
      })

      const result: MastraResponse = {
        suggestions: response.data.suggestions || [],
        warnings: response.data.warnings || [],
        encouragement: response.data.encouragement,
        technicalExplanation: response.data.technicalExplanation,
        confidence: response.data.confidence || 0.8,
        nextSteps: response.data.nextSteps,
        riskAssessment: response.data.riskAssessment,
      }

      // Update coaching session if available
      if (request.sessionContext?.sessionId) {
        await this.updateCoachingSession(request.sessionContext.sessionId, result)
      }

      logger.debug(`Mastra pose analysis completed for exercise: ${request.exercise}`)
      return result
    } catch (error) {
      logger.error('Failed to analyze pose with Mastra:', error)
      return this.analyzePoseFallback(request)
    }
  }

  async createCoachingSession(userId: string, exerciseType: string): Promise<MastraCoachingSession> {
    try {
      const response = await this.client.post('/coaching/sessions', {
        userId,
        exerciseType,
        startTime: new Date().toISOString(),
      })

      const session: MastraCoachingSession = {
        id: response.data.id,
        userId,
        exerciseType,
        startTime: new Date(response.data.startTime),
        totalAnalyses: 0,
        averageConfidence: 0,
        improvements: [],
        persistentIssues: [],
        coachingHistory: [],
      }

      this.coachingSessions.set(session.id, session)
      logger.info(`Mastra coaching session created: ${session.id}`)
      return session
    } catch (error) {
      logger.error('Failed to create Mastra coaching session:', error)
      return this.createFallbackCoachingSession(userId, exerciseType)
    }
  }

  async endCoachingSession(sessionId: string): Promise<MastraCoachingSession> {
    try {
      const response = await this.client.patch(`/coaching/sessions/${sessionId}`, {
        endTime: new Date().toISOString(),
      })

      const session = this.coachingSessions.get(sessionId)
      if (session) {
        session.endTime = new Date(response.data.endTime)
        this.coachingSessions.set(sessionId, session)
      }

      logger.info(`Mastra coaching session ended: ${sessionId}`)
      return response.data
    } catch (error) {
      logger.error(`Failed to end Mastra coaching session ${sessionId}:`, error)
      throw new Error('Failed to end coaching session')
    }
  }

  async getCoachingInsights(sessionId: string): Promise<{
    improvements: string[]
    persistentIssues: string[]
    recommendations: string[]
    nextSessionGoals: string[]
  }> {
    try {
      const response = await this.client.get(`/coaching/sessions/${sessionId}/insights`)
      
      return {
        improvements: response.data.improvements || [],
        persistentIssues: response.data.persistentIssues || [],
        recommendations: response.data.recommendations || [],
        nextSessionGoals: response.data.nextSessionGoals || [],
      }
    } catch (error) {
      logger.error(`Failed to get coaching insights for session ${sessionId}:`, error)
      return {
        improvements: [],
        persistentIssues: [],
        recommendations: ['Continue practicing with focus on form'],
        nextSessionGoals: ['Maintain current form quality'],
      }
    }
  }

  async getPersonalizedCoaching(userId: string, exerciseType: string): Promise<{
    personalizedTips: string[]
    commonMistakes: string[]
    progressionPlan: string[]
    motivationalMessages: string[]
  }> {
    try {
      const response = await this.client.get(`/coaching/personalized/${userId}`, {
        params: { exerciseType }
      })

      return {
        personalizedTips: response.data.personalizedTips || [],
        commonMistakes: response.data.commonMistakes || [],
        progressionPlan: response.data.progressionPlan || [],
        motivationalMessages: response.data.motivationalMessages || [],
      }
    } catch (error) {
      logger.error(`Failed to get personalized coaching for user ${userId}:`, error)
      return {
        personalizedTips: ['Focus on controlled movements'],
        commonMistakes: ['Rushing through exercises'],
        progressionPlan: ['Start with basic form, then increase intensity'],
        motivationalMessages: ['You\'re doing great! Keep up the good work!'],
      }
    }
  }

  private async updateCoachingSession(sessionId: string, analysis: MastraResponse): Promise<void> {
    const session = this.coachingSessions.get(sessionId)
    if (!session) return

    session.totalAnalyses++
    session.averageConfidence = (session.averageConfidence + analysis.confidence) / 2

    // Add to coaching history
    if (analysis.suggestions.length > 0) {
      session.coachingHistory.push({
        timestamp: new Date(),
        type: 'suggestion',
        message: analysis.suggestions[0],
        confidence: analysis.confidence,
      })
    }

    if (analysis.warnings.length > 0) {
      session.coachingHistory.push({
        timestamp: new Date(),
        type: 'warning',
        message: analysis.warnings[0],
        confidence: analysis.confidence,
      })
    }

    if (analysis.encouragement) {
      session.coachingHistory.push({
        timestamp: new Date(),
        type: 'encouragement',
        message: analysis.encouragement,
        confidence: analysis.confidence,
      })
    }

    this.coachingSessions.set(sessionId, session)
  }

  // Fallback methods for when Mastra is not available
  private analyzePoseFallback(request: MastraAnalysisRequest): MastraResponse {
    const suggestions: string[] = []
    const warnings: string[] = []

    // Basic form analysis based on exercise type
    switch (request.exercise) {
      case 'squat':
        if (request.formIssues.includes('knee_valgus')) {
          suggestions.push('Focus on pushing your knees out in line with your toes')
        }
        if (request.formIssues.includes('forward_lean')) {
          suggestions.push('Keep your chest up and sit back into your hips more')
        }
        break
      case 'pushup':
        if (request.formIssues.includes('sagging_hips')) {
          warnings.push('Engage your core to prevent lower back strain')
          suggestions.push('Think about holding a plank position throughout')
        }
        break
      case 'plank':
        if (request.formIssues.includes('sagging_hips')) {
          warnings.push('Lift your hips to protect your lower back')
        }
        break
    }

    // Add encouragement if no major issues
    const encouragement = request.formIssues.length === 0 
      ? 'Excellent form! Keep up the great work!'
      : undefined

    logger.warn(`Using fallback Mastra analysis for exercise: ${request.exercise}`)
    
    return {
      suggestions,
      warnings,
      encouragement,
      technicalExplanation: 'Basic form analysis - for detailed feedback, ensure Mastra service is running',
      confidence: 0.6,
      nextSteps: ['Continue practicing with focus on form'],
      riskAssessment: {
        level: warnings.length > 0 ? 'medium' : 'low',
        factors: warnings,
      },
    }
  }

  private createFallbackCoachingSession(userId: string, exerciseType: string): MastraCoachingSession {
    const session: MastraCoachingSession = {
      id: `fallback_${Date.now()}`,
      userId,
      exerciseType,
      startTime: new Date(),
      totalAnalyses: 0,
      averageConfidence: 0,
      improvements: [],
      persistentIssues: [],
      coachingHistory: [],
    }

    this.coachingSessions.set(session.id, session)
    logger.warn(`Created fallback Mastra coaching session: ${session.id}`)
    return session
  }

  async getConnectionStatus(): Promise<boolean> {
    return this.isConnected
  }

  getCoachingSession(sessionId: string): MastraCoachingSession | undefined {
    return this.coachingSessions.get(sessionId)
  }
}

// Export singleton instance
export const mastraService = new MastraService()
