import type { FastifyInstance } from 'fastify'
import { requireRoles, roleGroups } from '../../../../lib/security.js'
import { createEscrowController, handleMpesaB2cResultController, handleMpesaB2cTimeoutController, handleMpesaStkCallbackController, initiateStudentMpesaPayoutController, listPayoutsController, listWalletLedgerController, listWalletsController, markPayoutPaidController, readMpesaPaymentController, reconcileMpesaPaymentController, releaseEscrowController } from '../../controllers/finance/index.js'

async function registerFinanceRoutes(app: FastifyInstance) {
  const anyActor = requireRoles(...roleGroups.student, ...roleGroups.business, ...roleGroups.finance)
  const businessOnly = requireRoles(...roleGroups.business, ...roleGroups.finance)
  const financeOnly = requireRoles(...roleGroups.finance)
  const studentOnly = requireRoles(...roleGroups.student)
  app.get('/wallets', { preHandler: anyActor }, listWalletsController)
  app.get('/wallets/:id/ledger', { preHandler: anyActor }, listWalletLedgerController)
  app.post('/escrows', { preHandler: businessOnly }, createEscrowController)
  app.post('/escrows/:id/release', { preHandler: financeOnly }, releaseEscrowController)
  app.get('/payouts', { preHandler: anyActor }, listPayoutsController)
  app.post('/payouts/:id/mark-paid', { preHandler: financeOnly }, markPayoutPaidController)
  app.get('/mpesa/payments/:id', { preHandler: anyActor }, readMpesaPaymentController)
  app.post('/mpesa/payments/:id/reconcile', { preHandler: anyActor }, reconcileMpesaPaymentController)
  app.post('/mpesa/payouts', { preHandler: studentOnly }, initiateStudentMpesaPayoutController)
  // Safaricom cannot attach the user's JWT. Each request receives a high-entropy,
  // request-specific callback token and is still matched against provider IDs.
  app.post('/mpesa/stk/callback/:id/:token', handleMpesaStkCallbackController)
  app.post('/mpesa/b2c/result/:id/:token', handleMpesaB2cResultController)
  app.post('/mpesa/b2c/timeout/:id/:token', handleMpesaB2cTimeoutController)
}

export {
  registerFinanceRoutes
}
