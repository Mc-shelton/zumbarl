import { Redis } from 'ioredis'
import { env } from '../../../config/env.js'

function createRedisClient() {
  return new Redis(env.REDIS_URL, {
    connectTimeout: 500,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true
  })
}

export {
  createRedisClient
}
