import { buildApp } from './app.js'
import { env } from './config/env.js'
import { startMaintenanceJobs } from './background/maintenanceJobs.js'

const app = await buildApp()

const stopMaintenanceJobs = env.BACKGROUND_JOBS_MODE === 'inline'
  ? await startMaintenanceJobs(app.log)
  : () => {}

await app.listen({ host: env.HOST, port: env.PORT })

let shuttingDown = false
async function shutdown(signal: 'SIGTERM' | 'SIGINT') {
  if (shuttingDown) return
  shuttingDown = true
  app.log.info({ signal }, 'Graceful shutdown started')
  stopMaintenanceJobs()

  const forcedExit = globalThis.setTimeout(() => {
    app.log.error({ signal }, 'Graceful shutdown timed out')
    process.exitCode = 1
  }, env.SHUTDOWN_TIMEOUT_MS)
  forcedExit.unref()

  try {
    await app.close()
    globalThis.clearTimeout(forcedExit)
    app.log.info({ signal }, 'Graceful shutdown completed')
  } catch (error) {
    app.log.error(error, 'Graceful shutdown failed')
    process.exitCode = 1
  }
}

process.once('SIGTERM', () => { void shutdown('SIGTERM') })
process.once('SIGINT', () => { void shutdown('SIGINT') })
