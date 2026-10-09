import { processMarketplaceDeliveryDeadlinesService } from '../adapters/services/marketplace/index.js'
import { scheduleDueScoreRefreshes } from '../adapters/services/scores/index.js'
import { runEvergreenMaintenanceService } from '../adapters/services/evergreen/index.js'
import { processPendingMediaOptimizationsService } from '../adapters/services/uploads/index.js'

type MaintenanceLogger = {
  error: (value: unknown, message: string) => void
  info: (value: unknown, message: string) => void
}

type MaintenanceJob = {
  name: string
  intervalMs: number
  run: () => Promise<unknown>
}

const jobs: MaintenanceJob[] = [
  {
    name: 'media optimization',
    intervalMs: 15 * 1000,
    run: processPendingMediaOptimizationsService
  },
  {
    name: 'marketplace escrow deadline processing',
    intervalMs: 60 * 60 * 1000,
    run: processMarketplaceDeliveryDeadlinesService
  },
  {
    name: 'Zumbarl score refresh',
    intervalMs: 60 * 60 * 1000,
    run: scheduleDueScoreRefreshes
  },
  {
    name: 'Evergreen maintenance',
    intervalMs: 15 * 60 * 1000,
    run: runEvergreenMaintenanceService
  }
]

async function runJob(job: MaintenanceJob, logger: MaintenanceLogger) {
  const startedAt = Date.now()
  try {
    await job.run()
    logger.info({ job: job.name, durationMs: Date.now() - startedAt }, 'Background maintenance completed')
  } catch (error) {
    logger.error({ job: job.name, error }, 'Background maintenance failed')
  }
}

async function startMaintenanceJobs(logger: MaintenanceLogger) {
  await Promise.all(jobs.map((job) => runJob(job, logger)))
  const timers = jobs.map((job) => globalThis.setInterval(() => {
    void runJob(job, logger)
  }, job.intervalMs))
  for (const timer of timers) timer.unref()

  return () => {
    for (const timer of timers) globalThis.clearInterval(timer)
  }
}

export {
  startMaintenanceJobs,
  type MaintenanceLogger
}
