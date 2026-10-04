import { closeRedisCache, connectRedisCache } from './adapters/cache/index.js'
import { startMaintenanceJobs, type MaintenanceLogger } from './background/maintenanceJobs.js'
import { env } from './config/env.js'
import { prisma } from './lib/prisma.js'

function writeLog(level: 'info' | 'error', value: unknown, message: string) {
  const details = value instanceof Error
    ? { error: { name: value.name, message: value.message, stack: value.stack } }
    : value && typeof value === 'object' ? value : { value }
  const line = JSON.stringify({ level, time: new Date().toISOString(), service: 'zumbarl-worker', message, ...details })
  if (level === 'error') process.stderr.write(`${line}\n`)
  else process.stdout.write(`${line}\n`)
}

const logger: MaintenanceLogger = {
  info: (value, message) => writeLog('info', value, message),
  error: (value, message) => writeLog('error', value, message)
}

if (env.NODE_ENV === 'production' && env.BACKGROUND_JOBS_MODE !== 'external') {
  throw new Error('The production worker requires BACKGROUND_JOBS_MODE=external')
}

await connectRedisCache()
const stopJobs = await startMaintenanceJobs(logger)
logger.info({ mode: env.BACKGROUND_JOBS_MODE }, 'Background worker started')

let shuttingDown = false
async function shutdown(signal: 'SIGTERM' | 'SIGINT') {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'Background worker shutdown started')
  stopJobs()
  await Promise.all([closeRedisCache(), prisma.$disconnect()])
  logger.info({ signal }, 'Background worker shutdown completed')
}

process.once('SIGTERM', () => { void shutdown('SIGTERM') })
process.once('SIGINT', () => { void shutdown('SIGINT') })
