import { notFound } from '../../../lib/http.js'
import { requestMpesaB2cPayout, requestMpesaStkPush } from '../../index.js'
import { financeLedgerRepository } from '../../repositories/finance/index.js'

async function listWalletsService(ownerId: string | undefined, isAdmin: boolean) {
  return { data: await financeLedgerRepository.listWallets(ownerId, isAdmin) }
}

async function listWalletLedgerService(walletId: string, query: Record<string, unknown>) {
  await financeLedgerRepository.findWallet(walletId) ?? notFound('Wallet')
  return financeLedgerRepository.listWalletEntries(walletId, query)
}

async function createEscrowService(businessId: string | undefined, payload: Record<string, any>) {
  const escrow = await financeLedgerRepository.createEscrow({ ...payload, businessId, status: 'funded' })
  const mpesa = await requestMpesaStkPush({
    amount: payload.amount,
    phoneNumber: payload.phoneNumber ?? '+254700000000',
    accountReference: payload.scopeId,
    transactionDescription: `Zumbarl ${payload.scope} escrow`
  })
  return { escrow, mpesa }
}

async function releaseEscrowService(escrowId: string, payload: Record<string, any>) {
  const released = await financeLedgerRepository.releaseEscrow(escrowId, payload) ?? notFound('Escrow')
  const { payout } = released
  const mpesa = await requestMpesaB2cPayout({ amount: payload.amount, phoneNumber: payload.phoneNumber ?? '+254700000000', remarks: `Zumbarl payout ${payout.id}` })
  return { payout, mpesa }
}

function listPayoutsService(query: Record<string, unknown>) {
  return financeLedgerRepository.listPayouts(query)
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
