import { readRedisHealth } from '../../cache/index.js'
import { prisma } from '../../../lib/prisma.js'

class SystemReadinessRepository {
  async read() {
    const [postgres, redis] = await Promise.all([
      prisma.$queryRaw`SELECT 1`
        .then(() => 'ok')
        .catch(() => 'unavailable'),
      readRedisHealth()
    ])

    return {
      api: 'ok',
      postgres,
      redis,
      objectStorage: 'configured-through-adapter'
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
