import { prisma } from '../../lib/prisma.js'
import type { BookingStatus } from '@prisma/client'

export async function findConflictingBookings(providerId: string, startsAt: Date, endsAt: Date) {
  return prisma.booking.findMany({
    where: {
      providerId,
      status: { in: ['pending', 'confirmed'] },
      AND: [{ startsAt: { lt: endsAt } }, { endsAt: { gt: startsAt } }],
    },
  })
}

export async function findBookingsByProviderDate(providerId: string, date: Date, tenantId: string) {
  const start = new Date(date); start.setHours(0,0,0,0)
  const end = new Date(date); end.setHours(23,59,59,999)
  return prisma.booking.findMany({
    where: { tenantId, providerId, status: { in: ['pending','confirmed'] }, startsAt: { gte: start, lte: end } },
    orderBy: { startsAt: 'asc' },
  })
}

export async function findBookingById(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: { customer: true, provider: true, service: true, payment: true },
  })
}

export async function findBookingsByTenant(tenantId: string, date?: string) {
  const where: any = { tenantId }
  if (date) {
    const start = new Date(`${date}T00:00:00.000Z`)
    const end = new Date(`${date}T23:59:59.999Z`)
    where.startsAt = { gte: start, lte: end }
  }
  return prisma.booking.findMany({
    where,
    include: { customer: true, provider: true, service: true, payment: true },
    orderBy: { startsAt: 'asc' },
  })
}

export async function createBooking(data: {
  tenantId: string; customerId: string; providerId: string; serviceId: string
  startsAt: Date; endsAt: Date; priceSnapshot: number; idempotencyKey: string; notes?: string
}) {
  return prisma.booking.create({ data })
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  return prisma.booking.update({ where: { id }, data: { status } })
}
