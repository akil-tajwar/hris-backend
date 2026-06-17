import Redis from 'ioredis'

export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,

  retryStrategy(times) {
    return Math.min(times * 50, 2000)
  },

  reconnectOnError(err) {
    const targetError = 'READONLY'
    return err.message.includes(targetError)
  },
})