import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { cedarOSService } from '@/services/cedaros.service'
import { mastraService } from '@/services/mastra.service'
import { logger } from '@/utils/logger'

const router = Router()

// Validation schemas
const poseAnalysisSchema = z.object({
  exercise: z.string().min(1),
  landmarks: z.array(z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
    visibility: z.number().min(0).max(1),
  })).min(1),
  formIssues: z.array(z.string()).default([]),
  currentPhase: z.string().optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
})

// POST /api/pose/analyze
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = poseAnalysisSchema.parse(req.body)
    
    logger.info(`Pose analysis request for exercise: ${validatedData.exercise}`)

    // Try CedarOS first, then fallback to Mastra
    let analysis
    try {
      if (validatedData.sessionId) {
        analysis = await cedarOSService.analyzePose(validatedData.sessionId, validatedData.landmarks)
      } else {
        throw new Error('No session ID provided for CedarOS')
      }
    } catch (cedarError) {
      logger.warn('CedarOS analysis failed, falling back to Mastra:', cedarError)
      
      // Fallback to Mastra
      const mastraRequest = {
        exercise: validatedData.exercise,
        landmarks: validatedData.landmarks,
        formIssues: validatedData.formIssues,
        currentPhase: validatedData.currentPhase,
        sessionContext: validatedData.sessionId ? {
          sessionId: validatedData.sessionId,
          userId: validatedData.userId || 'unknown',
        } : undefined,
      }
      
      const mastraResponse = await mastraService.analyzePose(mastraRequest)
      
      // Convert Mastra response to CedarOS format
      analysis = {
        sessionId: validatedData.sessionId || 'fallback',
        timestamp: new Date(),
        landmarks: validatedData.landmarks,
        formScore: mastraResponse.confidence * 100,
        phase: validatedData.currentPhase || 'active',
        issues: validatedData.formIssues,
        suggestions: mastraResponse.suggestions,
        warnings: mastraResponse.warnings,
      }
    }

    res.json({
      success: true,
      data: analysis,
      source: analysis.sessionId.includes('fallback') ? 'mastra' : 'cedaros',
    })
  } catch (error) {
    logger.error('Pose analysis error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      })
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to analyze pose',
    })
  }
})

// POST /api/pose/session/start
router.post('/session/start', async (req: Request, res: Response) => {
  try {
    const { userId, exerciseType, metadata } = req.body

    if (!userId || !exerciseType) {
      return res.status(400).json({
        success: false,
        error: 'userId and exerciseType are required',
      })
    }

    logger.info(`Starting pose analysis session for user: ${userId}, exercise: ${exerciseType}`)

    // Create CedarOS session
    let session
    try {
      session = await cedarOSService.createSession({
        userId,
        exerciseType,
        status: 'active',
        metadata: metadata || {},
      })
    } catch (cedarError) {
      logger.warn('CedarOS session creation failed, using fallback:', cedarError)
      session = await cedarOSService.createFallbackSession({
        userId,
        exerciseType,
        status: 'active',
        metadata: metadata || {},
      })
    }

    // Create Mastra coaching session
    let coachingSession
    try {
      coachingSession = await mastraService.createCoachingSession(userId, exerciseType)
    } catch (mastraError) {
      logger.warn('Mastra coaching session creation failed:', mastraError)
    }

    res.json({
      success: true,
      data: {
        session,
        coachingSession,
      },
    })
  } catch (error) {
    logger.error('Session start error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to start session',
    })
  }
})

// POST /api/pose/session/end
router.post('/session/end', async (req: Request, res: Response) => {
  try {
    const { sessionId, coachingSessionId } = req.body

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required',
      })
    }

    logger.info(`Ending pose analysis session: ${sessionId}`)

    // End CedarOS session
    let session
    try {
      session = await cedarOSService.endSession(sessionId)
    } catch (cedarError) {
      logger.warn('CedarOS session end failed:', cedarError)
    }

    // End Mastra coaching session
    let coachingSession
    if (coachingSessionId) {
      try {
        coachingSession = await mastraService.endCoachingSession(coachingSessionId)
      } catch (mastraError) {
        logger.warn('Mastra coaching session end failed:', mastraError)
      }
    }

    // Get session progress
    let progress
    try {
      progress = await cedarOSService.getSessionProgress(sessionId)
    } catch (progressError) {
      logger.warn('Failed to get session progress:', progressError)
    }

    res.json({
      success: true,
      data: {
        session,
        coachingSession,
        progress,
      },
    })
  } catch (error) {
    logger.error('Session end error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to end session',
    })
  }
})

// GET /api/pose/session/:sessionId/progress
router.get('/session/:sessionId/progress', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params

    logger.info(`Getting progress for session: ${sessionId}`)

    const progress = await cedarOSService.getSessionProgress(sessionId)

    res.json({
      success: true,
      data: progress,
    })
  } catch (error) {
    logger.error('Get progress error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get session progress',
    })
  }
})

// GET /api/pose/user/:userId/sessions
router.get('/user/:userId/sessions', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const { limit = 50 } = req.query

    logger.info(`Getting sessions for user: ${userId}`)

    const sessions = await cedarOSService.getUserSessions(userId, parseInt(limit as string))

    res.json({
      success: true,
      data: sessions,
    })
  } catch (error) {
    logger.error('Get user sessions error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get user sessions',
    })
  }
})

export default router
