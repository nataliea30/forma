// Configuration file for environment variables
// This ensures proper separation between frontend and backend config

export const config = {
  // Frontend configuration (safe to expose)
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Forma',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  },
  
  // Feature flags (safe to expose)
  features: {
    enableAIAnalysis: process.env.NEXT_PUBLIC_ENABLE_AI_ANALYSIS === 'true',
    enableProgressTracking: process.env.NEXT_PUBLIC_ENABLE_PROGRESS_TRACKING === 'true',
  },
  
  // MediaPipe configuration (safe to expose)
  mediapipe: {
    modelUrl: process.env.NEXT_PUBLIC_MEDIAPIPE_MODEL_URL || 
      'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
  },
  
  // Backend configuration (server-side only)
  backend: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
  },
} as const

// Type-safe environment variable access
export const isServer = typeof window === 'undefined'

// Helper to get backend config (server-side only)
export function getBackendConfig() {
  if (!isServer) {
    throw new Error('Backend configuration can only be accessed on the server side')
  }
  return config.backend
}

// Helper to get frontend config (safe for client-side)
export function getFrontendConfig() {
  return {
    app: config.app,
    features: config.features,
    mediapipe: config.mediapipe,
  }
}
