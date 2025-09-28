import { Router, Request, Response } from 'express'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { config } from '@/config/environment'
import { logger } from '@/utils/logger'

const router = Router()

// Mock progress storage (in production, use a database)
const progressEntries: Array<{
  id: string
  patientId: string
  providerId: string
  exerciseType: string
  date: Date
  duration: number
  formScore: number
  notes: string
  landmarks?: any[]
  improvements: string[]
  concerns: string[]
}> = []

// Middleware to verify JWT token
const verifyToken = (req: Request, res: Response, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
    })
  }

  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as { userId: string; role: string }
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
    })
  }
}

// Apply token verification to all routes
router.use(verifyToken)

// Validation schemas
const saveProgressSchema = z.object({
  patientId: z.string().min(1),
  providerId: z.string().min(1),
  exerciseType: z.string().min(1),
  duration: z.number().min(0),
  formScore: z.number().min(0).max(100),
  notes: z.string().optional(),
  landmarks: z.array(z.any()).optional(),
  improvements: z.array(z.string()).default([]),
  concerns: z.array(z.string()).default([]),
})

// POST /api/progress/save
router.post('/save', async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as { userId: string; role: string }
    
    // Validate request body
    const validatedData = saveProgressSchema.parse(req.body)
    
    logger.info(`Saving progress for patient: ${validatedData.patientId}`)

    // Check permissions
    if (role !== 'healthcare_provider' && validatedData.patientId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      })
    }

    // Create progress entry
    const progressEntry = {
      id: `progress_${Date.now()}`,
      ...validatedData,
      date: new Date(),
    }

    progressEntries.push(progressEntry)

    res.status(201).json({
      success: true,
      data: {
        progress: progressEntry,
      },
    })
  } catch (error) {
    logger.error('Save progress error:', error)
    
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
      message: 'Failed to save progress',
    })
  }
})

// GET /api/progress/patient/:patientId
router.get('/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params
    const { userId, role } = req.user as { userId: string; role: string }
    
    logger.info(`Getting progress for patient: ${patientId}`)

    // Check permissions
    if (role !== 'healthcare_provider' && patientId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      })
    }

    const patientProgress = progressEntries
      .filter(p => p.patientId === patientId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())

    res.json({
      success: true,
      data: {
        progress: patientProgress,
      },
    })
  } catch (error) {
    logger.error('Get patient progress error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get patient progress',
    })
  }
})

// GET /api/progress/provider/:providerId
router.get('/provider/:providerId', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params
    const { userId, role } = req.user as { userId: string; role: string }
    
    if (role !== 'healthcare_provider') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      })
    }

    if (providerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      })
    }

    logger.info(`Getting progress for provider: ${providerId}`)

    const providerProgress = progressEntries
      .filter(p => p.providerId === providerId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())

    res.json({
      success: true,
      data: {
        progress: providerProgress,
      },
    })
  } catch (error) {
    logger.error('Get provider progress error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get provider progress',
    })
  }
})

// GET /api/progress/:progressId
router.get('/:progressId', async (req: Request, res: Response) => {
  try {
    const { progressId } = req.params
    const { userId, role } = req.user as { userId: string; role: string }
    
    logger.info(`Getting progress entry: ${progressId}`)

    const progressEntry = progressEntries.find(p => p.id === progressId)
    if (!progressEntry) {
      return res.status(404).json({
        success: false,
        error: 'Progress entry not found',
      })
    }

    // Check permissions
    if (role !== 'healthcare_provider' && progressEntry.patientId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      })
    }

    res.json({
      success: true,
      data: {
        progress: progressEntry,
      },
    })
  } catch (error) {
    logger.error('Get progress entry error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get progress entry',
    })
  }
})

// PUT /api/progress/:progressId
router.put('/:progressId', async (req: Request, res: Response) => {
  try {
    const { progressId } = req.params
    const { userId, role } = req.user as { userId: string; role: string }
    
    logger.info(`Updating progress entry: ${progressId}`)

    const progressIndex = progressEntries.findIndex(p => p.id === progressId)
    if (progressIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Progress entry not found',
      })
    }

    const progressEntry = progressEntries[progressIndex]

    // Check permissions
    if (role !== 'healthcare_provider' && progressEntry.patientId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      })
    }

    // Validate update data
    const updateSchema = z.object({
      notes: z.string().optional(),
      improvements: z.array(z.string()).optional(),
      concerns: z.array(z.string()).optional(),
    })

    const validatedData = updateSchema.parse(req.body)

    // Update progress entry
    progressEntries[progressIndex] = {
      ...progressEntries[progressIndex],
      ...validatedData,
    }

    res.json({
      success: true,
      data: {
        progress: progressEntries[progressIndex],
      },
    })
  } catch (error) {
    logger.error('Update progress entry error:', error)
    
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
      message: 'Failed to update progress entry',
    })
  }
})

export default router
