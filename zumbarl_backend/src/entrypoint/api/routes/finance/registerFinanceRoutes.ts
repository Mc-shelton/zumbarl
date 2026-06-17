import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import { createEscrowController, listPayoutsController, listWalletLedgerController, listWalletsController, markPayoutPaidController, releaseEscrowController } from '../../controllers/finance/index.js'

async function registerFinanceRoutes(app: FastifyInstance) {
  const anyActor = requireRoles(...roleGroups.student, ...roleGroups.business, ...roleGroups.finance)
  const businessOnly = requireRoles(...roleGroups.business, ...roleGroups.finance)
  const financeOnly = requireRoles(...roleGroups.finance)
  app.get('/wallets', { preHandler: anyActor }, listWalletsController)
  app.get('/wallets/:id/ledger', { preHandler: anyActor }, listWalletLedgerController)
  app.post('/escrows', { preHandler: businessOnly }, createEscrowController)
  app.post('/escrows/:id/release', { preHandler: financeOnly }, releaseEscrowController)
  app.get('/payouts', { preHandler: anyActor }, listPayoutsController)
  app.post('/payouts/:id/mark-paid', { preHandler: financeOnly }, markPayoutPaidController)
}

export {
  registerFinanceRoutes
}
