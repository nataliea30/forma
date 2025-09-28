import { Router, Request, Response } from 'express'
import { z } from 'zod'
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
  sessionContext: z.object({
    sessionId: z.string(),
    userId: z.string(),
    previousAnalyses: z.array(z.any()).optional(),
  }).optional(),
})

// GET /api/mastra/status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const isConnected = await mastraService.getConnectionStatus()
    
    res.json({
      success: true,
      data: {
        connected: isConnected,
        service: 'Mastra',
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.error('Mastra status check error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to check Mastra status',
    })
  }
})

// POST /api/mastra/connect
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const connected = await mastraService.connect()
    
    res.json({
      success: true,
      data: {
        connected,
        message: connected ? 'Mastra connected successfully' : 'Mastra connection failed',
      },
    })
  } catch (error) {
    logger.error('Mastra connect error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to connect to Mastra',
    })
  }
})

// POST /api/mastra/analyze
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = poseAnalysisSchema.parse(req.body)
    
    logger.info(`Mastra pose analysis request for exercise: ${validatedData.exercise}`)

    const analysis = await mastraService.analyzePose(validatedData)

    res.json({
      success: true,
      data: analysis,
    })
  } catch (error) {
    logger.error('Mastra pose analysis error:', error)
    
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
      message: 'Failed to analyze pose with Mastra',
    })
  }
})

// POST /api/mastra/coaching/sessions
router.post('/coaching/sessions', async (req: Request, res: Response) => {
  try {
    const { userId, exerciseType } = req.body

    if (!userId || !exerciseType) {
      return res.status(400).json({
        success: false,
        error: 'userId and exerciseType are required',
      })
    }

    logger.info(`Creating Mastra coaching session for user: ${userId}, exercise: ${exerciseType}`)

    const session = await mastraService.createCoachingSession(userId, exerciseType)

    res.json({
      success: true,
      data: session,
    })
  } catch (error) {
    logger.error('Mastra coaching session creation error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create Mastra coaching session',
    })
  }
})

// PATCH /api/mastra/coaching/sessions/:sessionId
router.patch('/coaching/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params

    logger.info(`Ending Mastra coaching session: ${sessionId}`)

    const session = await mastraService.endCoachingSession(sessionId)

    res.json({
      success: true,
      data: session,
    })
  } catch (error) {
    logger.error('Mastra coaching session end error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to end Mastra coaching session',
    })
  }
})

// GET /api/mastra/coaching/sessions/:sessionId/insights
router.get('/coaching/sessions/:sessionId/insights', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params

    logger.info(`Getting Mastra coaching insights for session: ${sessionId}`)

    const insights = await mastraService.getCoachingInsights(sessionId)

    res.json({
      success: true,
      data: insights,
    })
  } catch (error) {
    logger.error('Mastra coaching insights error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get Mastra coaching insights',
    })
  }
})

// GET /api/mastra/coaching/personalized/:userId
router.get('/coaching/personalized/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const { exerciseType } = req.query

    logger.info(`Getting personalized Mastra coaching for user: ${userId}`)

    const coaching = await mastraService.getPersonalizedCoaching(
      userId, 
      exerciseType as string || 'general'
    )

    res.json({
      success: true,
      data: coaching,
    })
  } catch (error) {
    logger.error('Mastra personalized coaching error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get personalized Mastra coaching',
    })
  }
})

// GET /api/mastra/coaching/sessions/:sessionId
router.get('/coaching/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params

    logger.info(`Getting Mastra coaching session: ${sessionId}`)

    const session = mastraService.getCoachingSession(sessionId)

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Coaching session not found',
      })
    }

    res.json({
      success: true,
      data: session,
    })
  } catch (error) {
    logger.error('Mastra coaching session get error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get Mastra coaching session',
    })
  }
})

export default router
