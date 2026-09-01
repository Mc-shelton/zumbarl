import { buildApp } from './app.js'
import { env } from './config/env.js'
import { migrateLegacyAppRecords, migrateWorkflowDomains } from './data/index.js'
import { backfillDefaultProjectDeliverables } from './shared/projects/ensureDefaultProjectDeliverable.js'
import { processMarketplaceDeliveryDeadlinesService } from './adapters/services/marketplace/index.js'
import { scheduleDueScoreRefreshes } from './adapters/services/scores/index.js'
import { runEvergreenMaintenanceService } from './adapters/services/evergreen/index.js'

await migrateLegacyAppRecords()
await migrateWorkflowDomains()
await backfillDefaultProjectDeliverables()

const app = await buildApp()

// Run once on boot and hourly thereafter. The repository guards every payout,
// so retries and overlapping application instances remain idempotent.
await processMarketplaceDeliveryDeadlinesService()
await scheduleDueScoreRefreshes()
const marketplaceEscrowTimer = globalThis.setInterval(() => {
  void processMarketplaceDeliveryDeadlinesService().catch((error) => app.log.error(error, 'Marketplace escrow deadline processing failed'))
}, 60 * 60 * 1000)
marketplaceEscrowTimer.unref()

// Recency decay changes Bayesian evidence even without a new engagement. Check
// hourly and refresh only scores whose 18-day cycle is due.
const scoreRefreshTimer = globalThis.setInterval(() => {
  void scheduleDueScoreRefreshes().catch((error) => app.log.error(error, 'Zumbarl score refresh failed'))
}, 60 * 60 * 1000)
scoreRefreshTimer.unref()

// Evergreen maintenance jobs acquire database leases, persist each run, and
// can also be replayed from the audited operations endpoint.
void runEvergreenMaintenanceService().catch((error) => app.log.error(error, 'Evergreen maintenance failed'))
const evergreenMaintenanceTimer = globalThis.setInterval(() => {
  void runEvergreenMaintenanceService().catch((error) => app.log.error(error, 'Evergreen maintenance failed'))
}, 15 * 60 * 1000)
evergreenMaintenanceTimer.unref()

await app.listen({ host: env.HOST, port: env.PORT })
