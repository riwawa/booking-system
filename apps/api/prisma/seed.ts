import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Business',
      slug: 'demo',
      timezone: 'America/Sao_Paulo',
      plan: 'starter',
      settings: {
        cancellationWindowHours: 24,
        bookingExpirationMinutes: 15,
        reminderHoursBefore: 24,
        requirePaymentUpfront: false,
        brandColor: '#6366f1',
        brandName: 'Demo Business',
      },
    },
  })

  const owner = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'owner@demo.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Admin Demo',
      email: 'owner@demo.com',
      passwordHash: await bcrypt.hash('demo1234', 10),
      role: 'owner',
      whatsappOptIn: false,
    },
  })

  const providerUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'provider@demo.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'João Silva',
      email: 'provider@demo.com',
      passwordHash: await bcrypt.hash('demo1234', 10),
      role: 'staff',
      whatsappOptIn: false,
    },
  })

  const provider = await prisma.provider.upsert({
    where: { userId: providerUser.id },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: providerUser.id,
      name: 'João Silva',
      specialty: 'Especialista',
      active: true,
    },
  })

  await prisma.availability.createMany({
    skipDuplicates: true,
    data: [1, 2, 3, 4, 5].map((day) => ({
      providerId: provider.id,
      dayOfWeek: day,
      startTime: '08:00',
      endTime: '18:00',
      active: true,
    })),
  })

  await prisma.service.upsert({
    where: { id: 'seed-service-1' },
    update: {},
    create: {
      id: 'seed-service-1',
      tenantId: tenant.id,
      name: 'Consulta Padrão',
      description: 'Atendimento de 30 minutos',
      durationMin: 30,
      price: 150.00,
      currency: 'BRL',
      requiresPayment: true,
      bufferAfterMin: 10,
      active: true,
    },
  })

  console.log('Seed concluído!')
  console.log(`Tenant: demo | Owner: owner@demo.com / demo1234`)
  console.log(`Provider: provider@demo.com / demo1234`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
