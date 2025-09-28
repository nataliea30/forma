import { z } from 'zod'

// Session schema validation
export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  exerciseType: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']),
  metadata: z.record(z.any()).optional(),
})

export type Session = z.infer<typeof SessionSchema>

// Session creation schema
export const CreateSessionSchema = z.object({
  userId: z.string(),
  exerciseType: z.string(),
  metadata: z.record(z.any()).optional(),
})

export type CreateSession = z.infer<typeof CreateSessionSchema>

// Session update schema
export const UpdateSessionSchema = z.object({
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).optional(),
  endTime: z.date().optional(),
  metadata: z.record(z.any()).optional(),
})

export type UpdateSession = z.infer<typeof UpdateSessionSchema>
