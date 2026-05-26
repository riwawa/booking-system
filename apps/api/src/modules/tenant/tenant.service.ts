import { prisma } from '../../lib/prisma.js'
import type {
  createTenantSchema, createProviderSchema, createServiceSchema, setAvailabilitySchema
} from './tenant.schema.js'
import type { z } from 'zod'

export async function createTenant(input: z.infer<typeof createTenantSchema>) {
  const exists = await prisma.tenant.findUnique({ where: { slug: input.slug } })
  if (exists) throw Object.assign(new Error('SLUG_TAKEN'), { statusCode: 409 })
  return prisma.tenant.create({ data: { ...input, settings: {} } })
}

export async function getTenantBySlug(slug: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      providers: { where: { active: true }, include: { availabilities: { where: { active: true } } } },
      services: { where: { active: true } },
    },
  })
  if (!tenant) throw new Error('NOT_FOUND')
  return tenant
}

export async function createProvider(tenantId: string, input: z.infer<typeof createProviderSchema>) {
  return prisma.provider.create({ data: { tenantId, ...input } })
}

export async function getProviders(tenantId: string) {
  return prisma.provider.findMany({
    where: { tenantId, active: true },
    include: { availabilities: { where: { active: true } } },
  })
}

export async function createService(tenantId: string, input: z.infer<typeof createServiceSchema>) {
  return prisma.service.create({ data: { tenantId, ...input } })
}

export async function getServices(tenantId: string) {
  return prisma.service.findMany({ where: { tenantId, active: true } })
}

export async function setAvailability(
  providerId: string,
  tenantId: string,
  slots: z.infer<typeof setAvailabilitySchema>,
) {
  const provider = await prisma.provider.findFirst({ where: { id: providerId, tenantId } })
  if (!provider) throw new Error('NOT_FOUND')
  await prisma.availability.deleteMany({ where: { providerId } })
  return prisma.availability.createMany({
    data: slots.map((s) => ({ providerId, ...s, active: true })),
  })
}
