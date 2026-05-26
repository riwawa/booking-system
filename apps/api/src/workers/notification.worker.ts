import { Worker } from 'bullmq'
import { redis } from '../lib/redis.js'
import { sendNotification } from '../modules/notification/notification.service.js'

export const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    const { bookingId, type } = job.data
    await sendNotification(bookingId, type)
  },
  { connection: redis, concurrency: 5 },
)

notificationWorker.on('completed', (job) => console.log(`[worker] ${job.id} done`))
notificationWorker.on('failed', (job, err) => console.error(`[worker] ${job?.id} failed:`, err.message))
