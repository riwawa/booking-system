import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import fastifyJwt from '@fastify/jwt'
import { authRoutes } from './modules/auth/auth.routes.js'
import { tenantRoutes } from './modules/tenant/tenant.routes.js'
import { bookingRoutes } from './modules/booking/booking.routes.js'
import { paymentRoutes } from './modules/payment/payment.routes.js'
import { notificationWorker } from './workers/notification.worker.js'
import { redis } from './lib/redis.js'
import { ZodError } from 'zod'
import type { FastifyRequest, FastifyReply } from 'fastify'

const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } })

await app.register(helmet)
await app.register(cors, {
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
  credentials: true,
})
await app.register(rateLimit, { global: true, max: 200, timeWindow: '1 minute', redis })
await app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET ?? 'dev-secret',
  sign: { expiresIn: '7d' },
})

app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
  try { await req.jwtVerify() } catch (e) { reply.send(e) }
})

app.setErrorHandler((error: Error & { statusCode?: number }, _req, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({ error: 'VALIDATION_ERROR', issues: error.issues })
  }
  const statusMap: Record<string, number> = {
    SLOT_UNAVAILABLE: 409, FORBIDDEN: 403, NOT_FOUND: 404,
    INVALID_STATUS_TRANSITION: 422, BOOKING_NOT_PENDING: 422,
    INVALID_CREDENTIALS: 401, EMAIL_TAKEN: 409, SLUG_TAKEN: 409,
  }
  const status = statusMap[error.message] ?? error.statusCode ?? 500
  if (status >= 500) app.log.error(error)
  return reply.status(status).send({ error: error.message })
})

await app.register(authRoutes, { prefix: '/api/auth' })
await app.register(tenantRoutes, { prefix: '/api/tenants' })
await app.register(bookingRoutes, { prefix: '/api/bookings' })
await app.register(paymentRoutes, { prefix: '/api/payments' })

app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

const shutdown = async () => { await app.close(); process.exit(0) }
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

try {
  const port = Number(process.env.PORT ?? 3001)
  await app.listen({ port, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}