import express, { Request, Response } from 'express'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { config } from '@/config/environment'
import { logger } from '@/utils/logger'
import { users, listUsersByRole, seedDemoUsers as seedUsers } from '@/store/memory'

const router: express.Router = express.Router()

// Seed the shared in-memory store so demo users exist
seedUsers(config.auth.bcryptRounds)

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
    ;(req as any).user = decoded
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
const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  additionalData: z.record(z.any()).optional(),
})

// GET /api/users/search?role=patient|healthcare_provider&query=...
router.get('/search', async (req: Request, res: Response) => {
  try {
    const roleParam = (req.query as any)['role'] ? String((req.query as any)['role']) : 'patient'
    if (roleParam !== 'patient' && roleParam !== 'healthcare_provider') {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be healthcare_provider or patient',
      })
    }

    const query = (req.query as any)['query'] ? String((req.query as any)['query']) : ''
    logger.info(`Searching users: role=${roleParam}, query="${query}"`)

    const results = listUsersByRole(roleParam as 'patient' | 'healthcare_provider', query)
    res.json({
      success: true,
      data: {
        users: results,
      },
    })
  } catch (error) {
    logger.error('Search users error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to search users',
    })
  }
})

// GET /api/users/profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as { userId: string; role: string }
    
    logger.info(`Getting profile for user: ${userId}`)

    const user = users.find(u => u.id === userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      })
    }

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
      },
    })
  } catch (error) {
    logger.error('Get profile error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get profile',
    })
  }
})

// PUT /api/users/profile
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user as { userId: string; role: string }
    
    // Validate request body
    const validatedData = updateProfileSchema.parse(req.body)
    
    logger.info(`Updating profile for user: ${userId}`)

    const userIndex = users.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      })
    }

    // Update user (assert non-null after index check)
    const existing = users[userIndex]!
    const updated = { ...existing }
    if (validatedData.name !== undefined) {
      updated.name = validatedData.name
    }
    if (validatedData.additionalData !== undefined) {
      updated.additionalData = validatedData.additionalData
    }
    users[userIndex] = updated

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updated

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
      },
    })
  } catch (error) {
    logger.error('Update profile error:', error)
    
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
      message: 'Failed to update profile',
    })
  }
})

// GET /api/users/:userId
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const { userId: authUserId, role } = (req as any).user as { userId: string; role: string }
    
    logger.info(`Getting user: ${userId}`)

    // Only allow users to access their own profile or healthcare providers to access patient profiles
    if (userId !== authUserId && role !== 'healthcare_provider') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      })
    }

    const user = users.find(u => u.id === userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      })
    }

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
      },
    })
  } catch (error) {
    logger.error('Get user error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get user',
    })
  }
})

// GET /api/users (for healthcare providers to list patients)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { role } = (req as any).user as { userId: string; role: string }
    
    if (role !== 'healthcare_provider') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      })
    }

    logger.info('Getting users list for healthcare provider')

    // Return all patients
    const patients = users
      .filter(u => u.role === 'patient')
      .map(({ password, ...user }) => user)

    res.json({
      success: true,
      data: {
        users: patients,
      },
    })
  } catch (error) {
    logger.error('Get users error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get users',
    })
  }
})

export default router
