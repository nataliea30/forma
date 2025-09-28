import { Router, Request, Response } from 'express'
import { cedarOSService } from '@/services/cedaros.service'
import { logger } from '@/utils/logger'

const router = Router()

// GET /api/cedar/status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const isConnected = await cedarOSService.getConnectionStatus()
    
    res.json({
      success: true,
      data: {
        connected: isConnected,
        service: 'CedarOS',
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.error('CedarOS status check error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to check CedarOS status',
    })
  }
})

// POST /api/cedar/connect
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const connected = await cedarOSService.connect()
    
    res.json({
      success: true,
      data: {
        connected,
        message: connected ? 'CedarOS connected successfully' : 'CedarOS connection failed',
      },
    })
  } catch (error) {
    logger.error('CedarOS connect error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to connect to CedarOS',
    })
  }
})

// POST /api/cedar/sessions
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const { userId, exerciseType, metadata } = req.body

    if (!userId || !exerciseType) {
      return res.status(400).json({
        success: false,
        error: 'userId and exerciseType are required',
      })
    }

    logger.info(`Creating CedarOS session for user: ${userId}, exercise: ${exerciseType}`)

    const session = await cedarOSService.createSession({
      userId,
      exerciseType,
      status: 'active',
      metadata: metadata || {},
    })

    res.json({
      success: true,
      data: session,
    })
  } catch (error) {
    logger.error('CedarOS session creation error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create CedarOS session',
    })
  }
})

// PATCH /api/cedar/sessions/:sessionId
router.patch('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params
    const updates = req.body

    logger.info(`Updating CedarOS session: ${sessionId}`)

    const session = await cedarOSService.updateSession(sessionId, updates)

    res.json({
      success: true,
      data: session,
    })
  } catch (error) {
    logger.error('CedarOS session update error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update CedarOS session',
    })
  }
})

// DELETE /api/cedar/sessions/:sessionId
router.delete('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params

    logger.info(`Ending CedarOS session: ${sessionId}`)

    const session = await cedarOSService.endSession(sessionId)

    res.json({
      success: true,
      data: session,
    })
  } catch (error) {
    logger.error('CedarOS session end error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to end CedarOS session',
    })
  }
})

// POST /api/cedar/analyze
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { sessionId, landmarks } = req.body

    if (!sessionId || !landmarks) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and landmarks are required',
      })
    }

    logger.info(`CedarOS pose analysis for session: ${sessionId}`)

    const analysis = await cedarOSService.analyzePose(sessionId, landmarks)

    res.json({
      success: true,
      data: analysis,
    })
  } catch (error) {
    logger.error('CedarOS pose analysis error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to analyze pose with CedarOS',
    })
  }
})

// GET /api/cedar/sessions/:sessionId/progress
router.get('/sessions/:sessionId/progress', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params

    logger.info(`Getting CedarOS progress for session: ${sessionId}`)

    const progress = await cedarOSService.getSessionProgress(sessionId)

    res.json({
      success: true,
      data: progress,
    })
  } catch (error) {
    logger.error('CedarOS progress error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get CedarOS progress',
    })
  }
})

// GET /api/cedar/users/:userId/sessions
router.get('/users/:userId/sessions', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const { limit = 50 } = req.query

    logger.info(`Getting CedarOS sessions for user: ${userId}`)

    const sessions = await cedarOSService.getUserSessions(userId, parseInt(limit as string))

    res.json({
      success: true,
      data: sessions,
    })
  } catch (error) {
    logger.error('CedarOS user sessions error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get CedarOS user sessions',
    })
  }
})

export default router
