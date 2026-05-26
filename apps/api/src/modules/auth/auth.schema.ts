import { z } from 'zod'

export const registerSchema = z.object({
  tenantSlug: z.string().min(3).max(50),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
})

export const loginSchema = z.object({
  tenantSlug: z.string(),
  email: z.string().email(),
  password: z.string(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
