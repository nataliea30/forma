import { z } from 'zod'

// Progress entry schema validation
export const ProgressEntrySchema = z.object({
  id: z.string(),
  patientId: z.string(),
  providerId: z.string(),
  exerciseType: z.string(),
  date: z.date(),
  duration: number,
  formScore: z.number().min(0).max(100),
  notes: z.string().optional(),
  landmarks: z.array(z.any()).optional(),
  improvements: z.array(z.string()).default([]),
  concerns: z.array(z.string()).default([]),
})

export type ProgressEntry = z.infer<typeof ProgressEntrySchema>

// Progress creation schema
export const CreateProgressSchema = z.object({
  patientId: z.string(),
  providerId: z.string(),
  exerciseType: z.string(),
  duration: z.number().min(0),
  formScore: z.number().min(0).max(100),
  notes: z.string().optional(),
  landmarks: z.array(z.any()).optional(),
  improvements: z.array(z.string()).default([]),
  concerns: z.array(z.string()).default([]),
})

export type CreateProgress = z.infer<typeof CreateProgressSchema>

// Progress update schema
export const UpdateProgressSchema = z.object({
  notes: z.string().optional(),
  improvements: z.array(z.string()).optional(),
  concerns: z.array(z.string()).optional(),
})

export type UpdateProgress = z.infer<typeof UpdateProgressSchema>
