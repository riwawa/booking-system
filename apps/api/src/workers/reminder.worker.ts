import { addHours } from 'date-fns'
import { prisma } from '../lib/prisma.js'
import { notificationQueue } from '../lib/queue.js'

export async function scheduleReminders() {
  const now = new Date()
  const bookings = await prisma.booking.findMany({
    where: {
      status: 'confirmed',
      startsAt: { gte: addHours(now, 23), lte: addHours(now, 25) },
    },
    include: { notifications: { where: { type: 'reminder' } } },
  })
  for (const b of bookings) {
    if (b.notifications.length > 0) continue
    await notificationQueue.add('notify', { bookingId: b.id, type: 'reminder' })
  }
  console.log(`[reminders] scheduled ${bookings.length}`)
}
