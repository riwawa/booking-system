import type { FastifyInstance } from 'fastify'
import { getSlotsSchema, createBookingSchema } from './booking.schema.js'
import { getAvailableSlots, createNewBooking, cancelBooking, findBookingById, findBookingsByTenant } from './booking.service.js'

export async function bookingRoutes(app: FastifyInstance) {
  app.get('/slots', async (req, reply) => {
    return reply.send(await getAvailableSlots(getSlotsSchema.parse(req.query)))
  })

  app.get('/', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    return reply.send(await findBookingsByTenant(req.user.tenantId, (req.query as any).date))
  })

  app.get('/:id', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const b = await findBookingById(req.params.id)
    if (!b) throw new Error('NOT_FOUND')
    return reply.send(b)
  })

  app.post('/', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    return reply.status(201).send(await createNewBooking(createBookingSchema.parse(req.body)))
  })

  app.delete('/:id', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const isStaff = ['owner', 'staff'].includes(req.user.role)
    return reply.send(await cancelBooking(req.params.id, req.user.sub, isStaff))
  })
}
