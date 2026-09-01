import type { Redis } from 'ioredis'
import { createRedisClient } from './createRedisClient.js'

const redis = createRedisClient()

async function connectRedisCache() {
  if (redis.status === 'end' || redis.status === 'wait') {
    await redis.connect()
  }
}

async function readCache<T>(key: string): Promise<T | null> {
  const value = await redis.get(key)
  return value ? JSON.parse(value) as T : null
}

async function writeCache(key: string, value: unknown, ttlSeconds: number) {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
}

async function touchPresence(key: string, memberId: string, timestamp: number, ttlSeconds: number) {
  const cutoff = timestamp - ttlSeconds * 1000
  const transaction = redis.multi()
  transaction.zadd(key, timestamp, memberId)
  transaction.zremrangebyscore(key, 0, cutoff)
  transaction.expire(key, ttlSeconds)
  transaction.zcard(key)
  const results = await transaction.exec()
  return Number(results?.[3]?.[1] || 0)
}

async function removePresence(key: string, memberId: string) {
  await redis.zrem(key, memberId)
}

async function countPresence(key: string, timestamp: number, ttlSeconds: number) {
  await redis.zremrangebyscore(key, 0, timestamp - ttlSeconds * 1000)
  return redis.zcard(key)
}

async function deleteCache(key: string) {
  await redis.del(key)
}

async function deleteCacheByPattern(pattern: string) {
  const stream = redis.scanStream({ match: pattern, count: 100 })
  for await (const keys of stream as AsyncIterable<string[]>) {
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }
}

async function readRedisHealth() {
  try {
    await connectRedisCache()
    return await redis.ping()
  } catch {
    return 'unavailable'
  }
}

function getRedisClient(): Redis {
  return redis
}

async function closeRedisCache() {
  if (redis.status !== 'end') {
    await redis.quit()
  }
}

export {
  connectRedisCache,
  readCache,
  writeCache,
  touchPresence,
  removePresence,
  countPresence,
  deleteCache,
  deleteCacheByPattern,
  readRedisHealth,
  getRedisClient,
  closeRedisCache
}
