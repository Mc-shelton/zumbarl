import { createPrismaRecordRepository, runPrismaRecordTransaction } from '../../../shared/repositories/index.js'

const wallets = createPrismaRecordRepository('wallets')
const walletEntries = createPrismaRecordRepository('walletEntries')
const escrows = createPrismaRecordRepository('escrows')
const payouts = createPrismaRecordRepository('payouts')

class FinanceLedgerRepository {
  listWallets(ownerId: string | undefined, isAdmin: boolean) {
    return wallets.listAll((wallet) => wallet.ownerId === ownerId || wallet.studentId === ownerId || isAdmin)
  }

  findWallet(id: string) {
    return wallets.findById(id)
  }

  listWalletEntries(walletId: string, query: Record<string, unknown>) {
    return walletEntries.list(query, (entry) => entry.walletId === walletId)
  }

  createEscrow(payload: Record<string, any>) {
    return escrows.create(payload)
  }

  findEscrow(id: string) {
    return escrows.findById(id)
  }

  updateEscrow(id: string, patch: Record<string, any>) {
    return escrows.updateById(id, patch)
  }

  createPayout(payload: Record<string, any>) {
    return payouts.create(payload)
  }

  listPayouts(query: Record<string, unknown>) {
    return payouts.list(query)
  }

  updatePayout(id: string, patch: Record<string, any>) {
    return payouts.updateById(id, patch)
  }

  releaseEscrow(escrowId: string, payload: Record<string, any>) {
    return runPrismaRecordTransaction(async (createRepository) => {
      const transactionEscrows = createRepository('escrows')
      const transactionPayouts = createRepository('payouts')
      const escrow = await transactionEscrows.findById(escrowId)
      if (!escrow) return null

      await transactionEscrows.updateById(escrowId, { status: 'released' })
      const payout = await transactionPayouts.create({ escrowId: escrow.id, ...payload, currency: escrow.currency, status: 'ready' })
      return { escrow, payout }
    })
  }
}

const financeLedgerRepository = new FinanceLedgerRepository()

export {
  FinanceLedgerRepository,
  financeLedgerRepository
}
