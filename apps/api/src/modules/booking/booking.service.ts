import { addMinutes, parseISO, setHours, setMinutes, setSeconds, areIntervalsOverlapping } from 'date-fns'
import { prisma } from '../../lib/prisma.js'
import { notificationQueue } from '../../lib/queue.js'
import {
  findConflictingBookings, findBookingsByProviderDate,
  findBookingById, createBooking, updateBookingStatus, findBookingsByTenant,
} from './booking.repository.js'
import type { CreateBookingInput, GetSlotsInput } from './booking.schema.js'

function generateIdempotencyKey(tenantId: string, customerId: string, providerId: string, startsAt: Date) {
  return `${tenantId}:${customerId}:${providerId}:${startsAt.toISOString()}`
}

function generateSlots(start: Date, end: Date, durationMin: number, bufferMin: number) {
  const slots: Array<{ startsAt: Date; endsAt: Date }> = []
  let current = start
  const step = durationMin + bufferMin
  while (addMinutes(current, durationMin) <= end) {
    slots.push({ startsAt: current, endsAt: addMinutes(current, durationMin) })
    current = addMinutes(current, step)
  }
  return slots
}

function hasConflict(startsAt: Date, endsAt: Date, existing: Array<{ startsAt: Date; endsAt: Date }>) {
  return existing.some((b) =>
    areIntervalsOverlapping(
      { start: startsAt, end: endsAt },
      { start: b.startsAt, end: b.endsAt },
      { inclusive: false },
    ),
  )
}

export async function getAvailableSlots(input: GetSlotsInput) {
  const { providerId, serviceId, date } = input
  const service = await prisma.service.findUniqueOrThrow({ where: { id: serviceId } })
  const target = parseISO(date)
  const dow = target.getDay()
  const avail = await prisma.availability.findFirst({ where: { providerId, dayOfWeek: dow, active: true } })
  if (!avail) return []
  const [sh, sm] = avail.startTime.split(':').map(Number)
  const [eh, em] = avail.endTime.split(':').map(Number)
  const dayStart = setSeconds(setMinutes(setHours(target, sh), sm), 0)
  const dayEnd = setSeconds(setMinutes(setHours(target, eh), em), 0)
  const allSlots = generateSlots(dayStart, dayEnd, service.durationMin, service.bufferAfterMin)
  const existing = await findBookingsByProviderDate(providerId, target, service.tenantId)
  return allSlots.map((s) => ({ ...s, available: !hasConflict(s.startsAt, s.endsAt, existing) }))
}

export async function createNewBooking(input: CreateBookingInput) {
  const { tenantId, customerId, providerId, serviceId, startsAt: raw, notes } = input
  const service = await prisma.service.findUniqueOrThrow({ where: { id: serviceId } })
  const startsAt = parseISO(raw)
  const endsAt = addMinutes(startsAt, service.durationMin)
  const key = generateIdempotencyKey(tenantId, customerId, providerId, startsAt)
  const existing = await prisma.booking.findUnique({ where: { idempotencyKey: key } })
  if (existing) return existing
  const conflicts = await findConflictingBookings(providerId, startsAt, endsAt)
  if (conflicts.length > 0) throw new Error('SLOT_UNAVAILABLE')
  const booking = await createBooking({
    tenantId, customerId, providerId, serviceId, startsAt, endsAt,
    priceSnapshot: Number(service.price), idempotencyKey: key, notes,
  })
  if (!service.requiresPayment) {
    await updateBookingStatus(booking.id, 'confirmed')
    await notificationQueue.add('notify', { bookingId: booking.id, type: 'confirmation' })
  }
  return booking
}

export async function cancelBooking(bookingId: string, userId: string, isStaff = false) {
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } })
  if (!isStaff && booking.customerId !== userId) throw new Error('FORBIDDEN')
  if (!['pending', 'confirmed'].includes(booking.status)) throw new Error('INVALID_STATUS_TRANSITION')
  const updated = await updateBookingStatus(bookingId, 'cancelled')
  await notificationQueue.add('notify', { bookingId, type: 'cancellation' })
  return updated
}

export { findBookingById, findBookingsByTenant }