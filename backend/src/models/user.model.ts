import { z } from 'zod'

// User schema validation
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['healthcare_provider', 'patient']),
  createdAt: z.date(),
  profileImage: z.string().url().optional(),
  specialization: z.string().optional(), // for healthcare providers
  licenseNumber: z.string().optional(), // for healthcare providers
  dateOfBirth: z.string().optional(), // for patients
  medicalHistory: z.array(z.string()).optional(), // for patients
})

export type User = z.infer<typeof UserSchema>

// User with password (for internal use)
export const UserWithPasswordSchema = UserSchema.extend({
  password: z.string().min(8),
})

export type UserWithPassword = z.infer<typeof UserWithPasswordSchema>

// User creation schema
export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['healthcare_provider', 'patient']),
  additionalData: z.record(z.any()).optional(),
})

export type CreateUser = z.infer<typeof CreateUserSchema>

// User update schema
export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  profileImage: z.string().url().optional(),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  medicalHistory: z.array(z.string()).optional(),
})

export type UpdateUser = z.infer<typeof UpdateUserSchema>
