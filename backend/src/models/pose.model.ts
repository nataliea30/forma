import { z } from 'zod'

// Pose landmark schema
export const PoseLandmarkSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
  visibility: z.number().min(0).max(1),
})

export type PoseLandmark = z.infer<typeof PoseLandmarkSchema>

// Pose analysis request schema
export const PoseAnalysisRequestSchema = z.object({
  exercise: z.string().min(1),
  landmarks: z.array(PoseLandmarkSchema).min(1),
  formIssues: z.array(z.string()).default([]),
  currentPhase: z.string().optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
})

export type PoseAnalysisRequest = z.infer<typeof PoseAnalysisRequestSchema>

// Pose analysis response schema
export const PoseAnalysisResponseSchema = z.object({
  sessionId: z.string(),
  timestamp: z.date(),
  landmarks: z.array(PoseLandmarkSchema),
  formScore: z.number().min(0).max(100),
  phase: z.string(),
  issues: z.array(z.string()),
  suggestions: z.array(z.string()),
  warnings: z.array(z.string()),
})

export type PoseAnalysisResponse = z.infer<typeof PoseAnalysisResponseSchema>

// Mastra analysis request schema
export const MastraAnalysisRequestSchema = z.object({
  exercise: z.string().min(1),
  landmarks: z.array(PoseLandmarkSchema).min(1),
  formIssues: z.array(z.string()).default([]),
  currentPhase: z.string().optional(),
  sessionContext: z.object({
    sessionId: z.string(),
    userId: z.string(),
    previousAnalyses: z.array(z.any()).optional(),
  }).optional(),
})

export type MastraAnalysisRequest = z.infer<typeof MastraAnalysisRequestSchema>

// Mastra analysis response schema
export const MastraAnalysisResponseSchema = z.object({
  suggestions: z.array(z.string()),
  warnings: z.array(z.string()),
  encouragement: z.string().optional(),
  technicalExplanation: z.string().optional(),
  confidence: z.number().min(0).max(1),
  nextSteps: z.array(z.string()).optional(),
  riskAssessment: z.object({
    level: z.enum(['low', 'medium', 'high']),
    factors: z.array(z.string()),
  }).optional(),
})

export type MastraAnalysisResponse = z.infer<typeof MastraAnalysisResponseSchema>
