import type { FastifyInstance } from 'fastify'
import { registerSchema, loginSchema } from './auth.schema.js'
import { register, login } from './auth.service.js'

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (req, reply) => {
    const input = registerSchema.parse(req.body)
    const user = await register(input)
    const token = app.jwt.sign({ sub: user.id, tenantId: user.tenantId, role: user.role, name: user.name })
    return reply.status(201).send({ token, user })
  })

  app.post('/login', async (req, reply) => {
    const input = loginSchema.parse(req.body)
    const { user, tenantId } = await login(input)
    const token = app.jwt.sign({ sub: user.id, tenantId, role: user.role, name: user.name })
    return reply.send({ token, user: { ...user, tenantId } })
  })

  app.get('/me', { onRequest: [app.authenticate] }, async (req, reply) => {
    return reply.send((req as any).user)
  })
}
