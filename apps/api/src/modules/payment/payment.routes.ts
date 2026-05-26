import type { FastifyInstance } from 'fastify'
import { createPaymentSchema, webhookSchema } from './payment.schema.js'
import { initiatePayment, handleWebhook, getPaymentByBooking } from './payment.service.js'

export async function paymentRoutes(app: FastifyInstance) {
  app.post('/', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { bookingId, method } = createPaymentSchema.parse(req.body)
    return reply.status(201).send(await initiatePayment(bookingId, method))
  })

  app.get('/booking/:bookingId', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    return reply.send(await getPaymentByBooking(req.params.bookingId))
  })

  app.post('/webhook', async (req, reply) => {
    const body = webhookSchema.parse(req.body)
    if (body.type === 'payment') await handleWebhook(body.data.id, req.body)
    return reply.status(200).send({ ok: true })
  })
}
