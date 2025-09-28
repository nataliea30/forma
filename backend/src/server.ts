import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import dotenv from 'dotenv'

import { config } from '@/config/environment'
import { logger } from '@/utils/logger'
import { errorHandler } from '@/middleware/errorHandler'
import { notFoundHandler } from '@/middleware/notFoundHandler'

// Import routes
import authRoutes from '@/routes/auth'
import userRoutes from '@/routes/users'
import poseRoutes from '@/routes/pose'
import progressRoutes from '@/routes/progress'
import cedarRoutes from '@/routes/cedar'
import mastraRoutes from '@/routes/mastra'
import healthRoutes from '@/routes/health'

// Load environment variables
dotenv.config()

const app = express()
const server = createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: config.cors.origins,
    methods: ['GET', 'POST']
  }
})

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// CORS configuration
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// Compression and logging
app.use(compression())
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: process.env.npm_package_version || '1.0.0'
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/pose', poseRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/cedar', cedarRoutes)
app.use('/api/mastra', mastraRoutes)
app.use('/api/health', healthRoutes)

// Socket.IO for real-time features
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`)
  
  socket.on('join-session', (sessionId) => {
    socket.join(`session-${sessionId}`)
    logger.info(`Client ${socket.id} joined session ${sessionId}`)
  })
  
  socket.on('pose-analysis', (data) => {
    // Broadcast pose analysis to session participants
    socket.to(`session-${data.sessionId}`).emit('pose-update', data)
  })
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`)
  })
})

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

// Start server
const PORT = config.port
server.listen(PORT, () => {
  logger.info(`🚀 Forma Backend Server running on port ${PORT}`)
  logger.info(`📊 Environment: ${config.nodeEnv}`)
  logger.info(`🔗 Frontend URL: ${config.frontendUrl}`)
  logger.info(`🎯 CORS Origins: ${config.cors.origins.join(', ')}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

export { app, io }
