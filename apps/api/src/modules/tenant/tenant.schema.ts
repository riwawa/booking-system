import { z } from 'zod'

export const createTenantSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'apenas letras minúsculas, números e hífens'),
  timezone: z.string().default('America/Sao_Paulo'),
  plan: z.enum(['free', 'starter', 'pro']).default('free'),
})

export const createProviderSchema = z.object({
  name: z.string().min(2).max(100),
  specialty: z.string().optional(),
  bio: z.string().max(500).optional(),
})

export const createServiceSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  durationMin: z.number().int().min(5).max(480),
  price: z.number().min(0),
  requiresPayment: z.boolean().default(false),
  bufferAfterMin: z.number().int().min(0).default(0),
})

export const setAvailabilitySchema = z.array(
  z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  })
)
