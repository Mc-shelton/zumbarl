import { buildApp } from './app.js'
import { env } from './config/env.js'
import { migrateLegacyAppRecords, migrateWorkflowDomains, seedDatabase } from './data/index.js'
import { backfillDefaultProjectDeliverables } from './shared/projects/ensureDefaultProjectDeliverable.js'
import { processMarketplaceDeliveryDeadlinesService } from './adapters/services/marketplace/index.js'

await migrateLegacyAppRecords()
await migrateWorkflowDomains()
await seedDatabase()
await backfillDefaultProjectDeliverables()

const app = await buildApp()

// Run once on boot and hourly thereafter. The repository guards every payout,
// so retries and overlapping application instances remain idempotent.
await processMarketplaceDeliveryDeadlinesService()
const marketplaceEscrowTimer = globalThis.setInterval(() => {
  void processMarketplaceDeliveryDeadlinesService().catch((error) => app.log.error(error, 'Marketplace escrow deadline processing failed'))
}, 60 * 60 * 1000)
marketplaceEscrowTimer.unref()

await app.listen({ host: env.HOST, port: env.PORT })
