import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma.js'
import type { RegisterInput, LoginInput } from './auth.schema.js'

export async function register(input: RegisterInput) {
  const tenant = await prisma.tenant.findUnique({ where: { slug: input.tenantSlug } })
  if (!tenant) throw new Error('NOT_FOUND')

  const existing = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email: input.email } },
  })
  if (existing) throw Object.assign(new Error('EMAIL_TAKEN'), { statusCode: 409 })

  const passwordHash = await bcrypt.hash(input.password, 10)
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      passwordHash,
      role: 'customer',
    },
  })

  return { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: tenant.id }
}

export async function login(input: LoginInput) {
  const tenant = await prisma.tenant.findUnique({ where: { slug: input.tenantSlug } })
  if (!tenant) throw new Error('NOT_FOUND')

  const user = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email: input.email } },
  })
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw Object.assign(new Error('INVALID_CREDENTIALS'), { statusCode: 401 })
  }

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    tenantId: tenant.id,
  }
}
