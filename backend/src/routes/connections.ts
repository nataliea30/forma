import express, { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '@/config/environment'
import { logger } from '@/utils/logger'
import {
  addConnection,
  getConnectionsByPatient,
  getConnectionsByProvider,
  findUserById,
  seedDemoUsers as seedUsers,
} from '@/store/memory'

const router: express.Router = express.Router()

// Seed store to ensure demo users exist
seedUsers(config.auth.bcryptRounds)

// Middleware to verify JWT token (relaxed typing for demo)
const verifyToken = (req: Request, res: Response, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' })
  }
  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as { userId: string; role: string }
    ;(req as any).user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' })
  }
}

router.use(verifyToken)

// POST /api/connections
// Create an active connection between patient and provider
router.post('/', async (req: Request, res: Response) => {
  try {
    const { patientId, providerId } = req.body as { patientId: string; providerId: string }

    if (!patientId || !providerId) {
      return res.status(400).json({ success: false, error: 'patientId and providerId are required' })
    }

    const patient = findUserById(patientId)
    const provider = findUserById(providerId)

    if (!patient || !provider) {
      return res.status(404).json({ success: false, error: 'Patient or provider not found' })
    }

    if (patient.role !== 'patient' || provider.role !== 'healthcare_provider') {
      return res.status(400).json({ success: false, error: 'Invalid roles for connection' })
    }

    const connection = addConnection(patientId, providerId, 'active')

    return res.json({
      success: true,
      data: { connection },
    })
  } catch (error) {
    logger.error('Create connection error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error', message: 'Failed to create connection' })
  }
})

// GET /api/connections/provider/:providerId
// Return list of patients connected to a provider
router.get('/provider/:providerId', async (req: Request, res: Response) => {
  try {
    const providerId = String((req.params as any)['providerId'])
    const conns = getConnectionsByProvider(providerId)
    const patients = conns
      .map(c => findUserById(c.patientId))
      .filter(Boolean)
      .map(u => {
        const { password, ...rest } = u as any
        return rest
      })

    return res.json({
      success: true,
      data: { connections: patients },
    })
  } catch (error) {
    logger.error('Get provider connections error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error', message: 'Failed to get connections' })
  }
})

// GET /api/connections/patient/:patientId
// Return list of providers connected to a patient
router.get('/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const patientId = String((req.params as any)['patientId'])
    const conns = getConnectionsByPatient(patientId)
    const providers = conns
      .map(c => findUserById(c.providerId))
      .filter(Boolean)
      .map(u => {
        const { password, ...rest } = u as any
        return rest
      })

    return res.json({
      success: true,
      data: { connections: providers },
    })
  } catch (error) {
    logger.error('Get patient connections error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error', message: 'Failed to get connections' })
  }
})

export default router