import express, { Request, Response } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt, { Secret, SignOptions } from 'jsonwebtoken'
import { config } from '@/config/environment'
import { logger } from '@/utils/logger'
import { users, addUser, findUserByEmail, seedDemoUsers as seedUsers } from '@/store/memory'

const router: express.Router = express.Router()

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['healthcare_provider', 'patient']),
  additionalData: z.record(z.any()).optional(),
})

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// Use shared in-memory store and seed demo users for development
seedUsers(config.auth.bcryptRounds)

// Generate JWT token
function generateToken(userId: string, role: string): string {
  const payload = { userId, role }
  // Avoid strict type issues with jsonwebtoken overloads under exactOptionalPropertyTypes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jwtAny: any = jwt
  return jwtAny.sign(payload, config.auth.jwtSecret, { expiresIn: config.auth.jwtExpiresIn })
}

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = signUpSchema.parse(req.body)
    
    logger.info(`Sign up attempt for email: ${validatedData.email}`)

    // Check if user already exists
    const existingUser = users.find(u => u.email === validatedData.email)
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, config.auth.bcryptRounds)

    // Create user
    const newUser = {
      id: `user_${Date.now()}`,
      email: validatedData.email,
      password: hashedPassword,
      name: validatedData.name,
      role: validatedData.role,
      createdAt: new Date(),
      additionalData: validatedData.additionalData,
    }

    addUser(newUser)

    // Generate token
    const token = generateToken(newUser.id, newUser.role)

    // Remove password from response
    const { password, ...userWithoutPassword } = newUser

    logger.info(`User created successfully: ${newUser.email}`)

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
    })
  } catch (error) {
    logger.error('Sign up error:', error)
    
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
      message: 'Failed to create account',
    })
  }
})

// POST /api/auth/signin
router.post('/signin', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = signInSchema.parse(req.body)
    
    logger.info(`Sign in attempt for email: ${validatedData.email}`)

    // Find user
    const user = users.find(u => u.email === validatedData.email)
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      })
    }

    // Generate token
    const token = generateToken(user.id, user.role)

    // Remove password from response
    const { password, ...userWithoutPassword } = user

    logger.info(`User signed in successfully: ${user.email}`)

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
    })
  } catch (error) {
    logger.error('Sign in error:', error)
    
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
      message: 'Failed to sign in',
    })
  }
})

// POST /api/auth/signout
router.post('/signout', async (req: Request, res: Response) => {
  try {
    // In a real app, you might want to blacklist the token
    // For now, we'll just return success
    logger.info('User signed out')
    
    res.json({
      success: true,
      message: 'Signed out successfully',
    })
  } catch (error) {
    logger.error('Sign out error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to sign out',
    })
  }
})

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      })
    }

    // Verify token
    const decoded = jwt.verify(token, config.auth.jwtSecret) as { userId: string; role: string }
    
    // Find user
    const user = users.find(u => u.id === decoded.userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      })
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
      },
    })
  } catch (error) {
    logger.error('Get user error:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      })
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get user',
    })
  }
})

export default router
