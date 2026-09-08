import { ApiError, forbidden, notFound } from '../../../lib/http.js'
import { roleGroups, type AuthUser } from '../../../lib/security.js'
import { createPrismaRecordRepository } from '../../../shared/repositories/index.js'
import { financeLedgerRepository } from '../../repositories/finance/index.js'

function isFinanceActor(actor: AuthUser | undefined) {
  return Boolean(actor && roleGroups.finance.includes(actor.role))
}

async function listWalletsService(actor: AuthUser | undefined) {
  return { data: await financeLedgerRepository.listWallets(actor?.studentId, actor?.businessId, isFinanceActor(actor)) }
}

async function listWalletLedgerService(walletId: string, query: Record<string, unknown>, actor: AuthUser | undefined) {
  const ownedWallet = await financeLedgerRepository.findWallet(walletId) ?? notFound('Wallet')
  const canRead = isFinanceActor(actor)
    || (ownedWallet.kind === 'student' && ownedWallet.ownerId === actor?.studentId)
    || (ownedWallet.kind === 'company' && ownedWallet.ownerId === actor?.businessId)
  if (!canRead) forbidden('You can only view your own wallet ledger')
  return financeLedgerRepository.listWalletEntries(walletId, ownedWallet.kind, query)
}

async function createEscrowService(businessId: string | undefined, payload: Record<string, any>) {
  if (!businessId) throw new ApiError(403, 'A company wallet is required to create escrow', 'COMPANY_WALLET_REQUIRED')
  const escrow = await financeLedgerRepository.createEscrow(businessId, payload)
  return { escrow }
}

async function releaseEscrowService(escrowId: string, payload: Record<string, any>) {
  const released = await financeLedgerRepository.releaseEscrow(escrowId, payload) ?? notFound('Escrow')
  return released
}

async function listPayoutsService(query: Record<string, unknown>, actor: AuthUser | undefined) {
  if (isFinanceActor(actor)) return financeLedgerRepository.listPayouts(query)
  if (actor?.studentId) {
    return financeLedgerRepository.listPayouts(query, (payout) => payout.studentId === actor.studentId)
  }
  if (actor?.businessId) {
    const [projects, escrows] = await Promise.all([
      createPrismaRecordRepository('projects').listAll((project) => project.businessId === actor.businessId),
      createPrismaRecordRepository('escrows').listAll((escrow) => escrow.businessId === actor.businessId)
    ])
    const projectIds = new Set(projects.map((project) => project.id))
    const escrowIds = new Set(escrows.map((escrow) => escrow.id))
    return financeLedgerRepository.listPayouts(query, (payout) => projectIds.has(payout.projectId) || escrowIds.has(payout.escrowId))
  }
  forbidden('You do not have access to payouts')
}

async function markPayoutPaidService(id: string) {
  return await financeLedgerRepository.updatePayout(id, { status: 'paid', paidAt: new Date().toISOString() }) ?? notFound('Payout')
}

export {
  listWalletsService,
  listWalletLedgerService,
  createEscrowService,
  releaseEscrowService,
  listPayoutsService,
  markPayoutPaidService
}
