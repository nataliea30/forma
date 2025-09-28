import { Router, Request, Response } from 'express'
import { cedarOSService } from '@/services/cedaros.service'
import { mastraService } from '@/services/mastra.service'
import { logger } from '@/utils/logger'

const router = Router()

// GET /api/health
router.get('/', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now()
    
    // Check service connections
    const [cedarStatus, mastraStatus] = await Promise.allSettled([
      cedarOSService.getConnectionStatus(),
      mastraService.getConnectionStatus(),
    ])

    const responseTime = Date.now() - startTime

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      responseTime: `${responseTime}ms`,
      services: {
        cedaros: {
          status: cedarStatus.status === 'fulfilled' ? 'connected' : 'disconnected',
          connected: cedarStatus.status === 'fulfilled' ? cedarStatus.value : false,
        },
        mastra: {
          status: mastraStatus.status === 'fulfilled' ? 'connected' : 'disconnected',
          connected: mastraStatus.status === 'fulfilled' ? mastraStatus.value : false,
        },
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid,
      },
    }

    // Determine overall health status
    const allServicesConnected = health.services.cedaros.connected && health.services.mastra.connected
    const overallStatus = allServicesConnected ? 'healthy' : 'degraded'

    res.status(overallStatus === 'healthy' ? 200 : 503).json({
      success: true,
      data: {
        ...health,
        status: overallStatus,
      },
    })
  } catch (error) {
    logger.error('Health check error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Health check failed',
    })
  }
})

// GET /api/health/ready
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if all critical services are ready
    const [cedarStatus, mastraStatus] = await Promise.allSettled([
      cedarOSService.getConnectionStatus(),
      mastraService.getConnectionStatus(),
    ])

    const cedarReady = cedarStatus.status === 'fulfilled' && cedarStatus.value
    const mastraReady = mastraStatus.status === 'fulfilled' && mastraStatus.value

    // For readiness, we can be ready even if some services are down
    // as long as the core application is running
    const isReady = true // Core app is always ready

    res.status(isReady ? 200 : 503).json({
      success: true,
      data: {
        ready: isReady,
        timestamp: new Date().toISOString(),
        services: {
          cedaros: cedarReady,
          mastra: mastraReady,
        },
      },
    })
  } catch (error) {
    logger.error('Readiness check error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Readiness check failed',
    })
  }
})

// GET /api/health/live
router.get('/live', async (req: Request, res: Response) => {
  try {
    // Liveness check - just verify the app is running
    res.status(200).json({
      success: true,
      data: {
        alive: true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    })
  } catch (error) {
    logger.error('Liveness check error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Liveness check failed',
    })
  }
})

// GET /api/health/services
router.get('/services', async (req: Request, res: Response) => {
  try {
    const [cedarStatus, mastraStatus] = await Promise.allSettled([
      cedarOSService.getConnectionStatus(),
      mastraService.getConnectionStatus(),
    ])

    const services = {
      cedaros: {
        name: 'CedarOS',
        status: cedarStatus.status === 'fulfilled' ? 'connected' : 'disconnected',
        connected: cedarStatus.status === 'fulfilled' ? cedarStatus.value : false,
        lastCheck: new Date().toISOString(),
      },
      mastra: {
        name: 'Mastra',
        status: mastraStatus.status === 'fulfilled' ? 'connected' : 'disconnected',
        connected: mastraStatus.status === 'fulfilled' ? mastraStatus.value : false,
        lastCheck: new Date().toISOString(),
      },
    }

    res.json({
      success: true,
      data: services,
    })
  } catch (error) {
    logger.error('Services check error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Services check failed',
    })
  }
})

export default router
