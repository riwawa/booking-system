import ioredis from 'ioredis'

export const redis = new ioredis.default({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  maxRetriesPerRequest: null,
})

redis.on('error', (err: Error) => console.error('[Redis]', err.message))