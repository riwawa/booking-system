import { Queue } from 'bullmq'
import { redis } from './redis.js'
const opts = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: 100,
  removeOnFail: 500,
}
export const notificationQueue = new Queue('notifications', { connection: redis, defaultJobOptions: opts })
export const reminderQueue = new Queue('reminders', { connection: redis, defaultJobOptions: opts })
export type NotificationJob = { bookingId: string; type: 'confirmation' | 'reminder' | 'cancellation' }
