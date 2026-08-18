import { pageEnvelope } from '../../../lib/http.js'
import { prisma } from '../../../lib/prisma.js'
import { createPrismaRecordRepository, runPrismaRecordTransaction } from '../../../shared/repositories/index.js'
import { mapStudentWallet } from '../../../shared/services/walletLedger.js'

const escrows = createPrismaRecordRepository('escrows')
const payouts = createPrismaRecordRepository('payouts')

class FinanceLedgerRepository {
  async listWallets(ownerId: string | undefined, isAdmin: boolean) {
    const wallets = await prisma.wallet.findMany({
      where: isAdmin ? {} : { studentId: ownerId },
      orderBy: { createdAt: 'asc' }
    })
    return wallets.map(mapStudentWallet)
  }

  async findWallet(id: string) {
    return mapStudentWallet(await prisma.wallet.findUnique({ where: { id } }))
  }

  async listWalletEntries(walletId: string, query: Record<string, unknown>) {
    const transactions = await prisma.transaction.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' }
    })
    return pageEnvelope(transactions.map((transaction) => ({
      id: transaction.id,
      walletId: transaction.walletId,
      type: transaction.type,
      status: transaction.status,
      direction: transaction.amount >= 0 ? 'credit' : 'debit',
      amount: transaction.amount,
      currency: transaction.currency,
      description: transaction.description,
      opportunityId: transaction.opportunityId,
      metadata: transaction.metadata,
      createdAt: transaction.createdAt.toISOString()
    })), query)
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
