import { Redis } from 'ioredis'

export const redis = new Redis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  maxRetriesPerRequest: null,
  lazyConnect: true,
})

redis.on('error', (err: Error) => console.error('[Redis]', err.message))