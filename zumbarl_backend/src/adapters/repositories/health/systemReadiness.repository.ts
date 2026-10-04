import { readRedisHealth } from '../../cache/index.js'
import { readObjectStorageHealth } from '../../storage/index.js'
import { prisma } from '../../../lib/prisma.js'
import { env } from '../../../config/env.js'

async function bounded<T>(operation: Promise<T>, fallback: T) {
  let timer: ReturnType<typeof globalThis.setTimeout> | undefined
  try {
    return await Promise.race([
      operation,
      new Promise<T>((resolve) => {
        timer = globalThis.setTimeout(() => resolve(fallback), env.READINESS_TIMEOUT_MS)
      })
    ])
  } finally {
    if (timer) globalThis.clearTimeout(timer)
  }
}

class SystemReadinessRepository {
  async read() {
    const [postgres, redis, objectStorage] = await Promise.all([
      bounded(prisma.$queryRaw`SELECT 1`
        .then(() => 'ok')
        .catch(() => 'unavailable'), 'unavailable'),
      bounded(readRedisHealth(), 'unavailable'),
      bounded(readObjectStorageHealth(), 'unavailable')
    ])

    return {
      api: 'ok',
      postgres,
      redis: redis === 'PONG' ? 'ok' : redis,
      objectStorage
    }
  }
}

const systemReadinessRepository = new SystemReadinessRepository()

const readSystemReadinessRepository = systemReadinessRepository.read.bind(systemReadinessRepository)

export {
  SystemReadinessRepository,
  systemReadinessRepository,
  readSystemReadinessRepository
}
