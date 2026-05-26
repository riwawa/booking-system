import fp from 'fastify-plugin'
import { ZodError } from 'zod'

export default fp(async (app) => {
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', issues: error.issues })
    }
    const msg = error.message
    const map: Record<string, number> = {
      SLOT_UNAVAILABLE: 409,
      FORBIDDEN: 403,
      INVALID_STATUS_TRANSITION: 422,
      BOOKING_NOT_PENDING: 422,
      NOT_FOUND: 404,
    }
    const status = map[msg] ?? error.statusCode ?? 500
    app.log.error(error)
    return reply.status(status).send({ error: msg })
  })
})
