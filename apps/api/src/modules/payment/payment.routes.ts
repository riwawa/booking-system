import type { FastifyInstance } from 'fastify'
import { webhookSchema } from './payment.schema.js'
import { createCheckoutPreference, handleWebhook, getPaymentByBooking } from './payment.service.js'

export async function paymentRoutes(app: FastifyInstance) {
  // cria preferência de checkout pro
  app.post('/preference', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const { bookingId } = req.body as { bookingId: string }
    if (!bookingId) throw new Error('bookingId é obrigatório')
    const result = await createCheckoutPreference(bookingId)
    return reply.status(201).send(result)
  })

  app.get('/booking/:bookingId', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    return reply.send(await getPaymentByBooking(req.params.bookingId))
  })

  // webhook do Mercado Pago — sem auth JWT
  app.post('/webhook', async (req, reply) => {
    const body = req.body as any
    // MP manda dois tipos: type=payment com data.id, ou action=payment.updated com data.id
    const paymentId = body?.data?.id ?? body?.resource?.split('/').pop()
    if (paymentId && (body?.type === 'payment' || body?.action?.startsWith('payment'))) {
      await handleWebhook(String(paymentId), req.body)
    }
    return reply.status(200).send({ ok: true })
  })
}