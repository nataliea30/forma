import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/forma_db',
  },
  
  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },
  
  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4',
  },
  
  // CedarOS
  cedaros: {
    apiUrl: process.env.CEDAROS_API_URL || 'http://localhost:8080',
    apiKey: process.env.CEDAROS_API_KEY || '',
  },
  
  // Mastra
  mastra: {
    apiUrl: process.env.MASTRA_API_URL || 'http://localhost:8081',
    apiKey: process.env.MASTRA_API_KEY || '',
  },
  
  // MediaPipe
  mediapipe: {
    modelUrl: process.env.MEDIAPIPE_MODEL_URL || 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
  },
  
  // File upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  },
  
  // Health check
  healthCheck: {
    interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10), // 30 seconds
  },
} as const

// Validate required environment variables
export function validateEnvironment() {
  const required = [
    'OPENAI_API_KEY',
    'JWT_SECRET',
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

// Export individual configs for easier imports
export const {
  port,
  nodeEnv,
  frontendUrl,
  database,
  auth,
  openai,
  cedaros,
  mastra,
  mediapipe,
  upload,
  logging,
  rateLimit,
  cors,
  healthCheck,
} = config
