import { migrateLegacyAppRecords, migrateWorkflowDomains } from './index.js'
import { backfillDefaultProjectDeliverables } from '../shared/projects/ensureDefaultProjectDeliverable.js'

const result = {
  legacy: await migrateLegacyAppRecords(),
  workflowDomains: await migrateWorkflowDomains(),
  defaultDeliverables: await backfillDefaultProjectDeliverables()
}

process.stdout.write(`${JSON.stringify(result)}\n`)
