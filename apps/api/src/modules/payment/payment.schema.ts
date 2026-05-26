import { z } from 'zod'
export const createPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  method: z.enum(['pix', 'credit_card', 'boleto']),
})
export const webhookSchema = z.object({
  type: z.string(),
  data: z.object({ id: z.string() }),
})
