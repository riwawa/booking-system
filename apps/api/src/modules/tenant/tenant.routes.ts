import type { FastifyInstance } from 'fastify'
import {
  createTenantSchema, createProviderSchema, createServiceSchema, setAvailabilitySchema,
} from './tenant.schema.js'
import {
  createTenant, getTenantBySlug, createProvider, getProviders,
  createService, getServices, setAvailability,
} from './tenant.service.js'

export async function tenantRoutes(app: FastifyInstance) {
  app.post('/', async (req, reply) => {
    const input = createTenantSchema.parse(req.body)
    return reply.status(201).send(await createTenant(input))
  })

  app.get('/:slug', async (req: any, reply) => {
    return reply.send(await getTenantBySlug(req.params.slug))
  })

  app.post('/:slug/providers', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const input = createProviderSchema.parse(req.body)
    return reply.status(201).send(await createProvider(req.user.tenantId, input))
  })

  app.get('/:slug/providers', async (req: any, reply) => {
    const tenant = await getTenantBySlug(req.params.slug)
    return reply.send(await getProviders(tenant.id))
  })

  app.post('/:slug/services', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const input = createServiceSchema.parse(req.body)
    return reply.status(201).send(await createService(req.user.tenantId, input))
  })

  app.get('/:slug/services', async (req: any, reply) => {
    const tenant = await getTenantBySlug(req.params.slug)
    return reply.send(await getServices(tenant.id))
  })

  app.put('/:slug/providers/:providerId/availability', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const slots = setAvailabilitySchema.parse(req.body)
    return reply.send(await setAvailability(req.params.providerId, req.user.tenantId, slots))
  })
}
