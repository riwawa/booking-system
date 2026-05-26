import { z } from 'zod'
export const getSlotsSchema = z.object({
  providerId: z.string().uuid(),
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
export const createBookingSchema = z.object({
  tenantId: z.string().uuid(),
  customerId: z.string().uuid(),
  providerId: z.string().uuid(),
  serviceId: z.string().uuid(),
  startsAt: z.string().datetime(),
  notes: z.string().max(500).optional(),
})
export type GetSlotsInput = z.infer<typeof getSlotsSchema>
export type CreateBookingInput = z.infer<typeof createBookingSchema>
