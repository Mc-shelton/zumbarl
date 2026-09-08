import { randomUUID } from 'node:crypto'
import { ApiError, pageEnvelope } from '../../../lib/http.js'
import { prisma } from '../../../lib/prisma.js'
import { createPrismaRecordRepository, runPrismaRecordTransaction } from '../../../shared/repositories/index.js'
import { normalizeCurrency, normalizeMoney } from '../../../shared/services/money.js'
import { creditStudentWallet, debitCompanyWallet, mapCompanyWallet, mapStudentWallet } from '../../../shared/services/walletLedger.js'

const escrows = createPrismaRecordRepository('escrows')
const payouts = createPrismaRecordRepository('payouts')

class FinanceLedgerRepository {
  async listWallets(studentId: string | undefined, companyId: string | undefined, isFinance: boolean) {
    const [studentWallets, companyWallets] = await Promise.all([
      prisma.wallet.findMany({ where: isFinance ? {} : { studentId: studentId || '__none__' }, orderBy: { createdAt: 'asc' } }),
      prisma.companyWallet.findMany({ where: isFinance ? {} : { companyId: companyId || '__none__' }, orderBy: { createdAt: 'asc' } })
    ])
    return [
      ...studentWallets.map(mapStudentWallet),
      ...companyWallets.map((wallet) => ({ ...mapCompanyWallet(wallet), type: 'COMPANY', pendingBalance: 0 }))
    ].filter(Boolean)
  }

  async findWallet(id: string) {
    const [studentWallet, companyWallet] = await Promise.all([
      prisma.wallet.findUnique({ where: { id } }),
      prisma.companyWallet.findUnique({ where: { id } })
    ])
    if (studentWallet) return { kind: 'student' as const, wallet: mapStudentWallet(studentWallet), ownerId: studentWallet.studentId }
    if (companyWallet) return { kind: 'company' as const, wallet: mapCompanyWallet(companyWallet), ownerId: companyWallet.companyId }
    return null
  }

  async listWalletEntries(walletId: string, kind: 'student' | 'company', query: Record<string, unknown>) {
    const transactions = await prisma.transaction.findMany({
      where: kind === 'student' ? { walletId } : { companyWalletId: walletId },
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

  createEscrow(companyId: string, payload: Record<string, any>) {
    return runPrismaRecordTransaction(async (createRepository, tx) => {
      const transactionEscrows = createRepository('escrows')
      const currency = normalizeCurrency(payload.currency || 'KES')
      const amount = normalizeMoney(payload.amount, currency)
      const reference = String(payload.reference || randomUUID())
      if (payload.reference) {
        const existing = (await transactionEscrows.listAll((item) => item.reference === reference && item.businessId === companyId))[0]
        if (existing) return existing
      }
      await debitCompanyWallet(tx, companyId, amount, {
        type: 'ESCROW_HOLD',
        currency,
        reference: `escrow-funding:${companyId}:${payload.scope}:${payload.scopeId}:${reference}`,
        description: `Escrow funding for ${payload.scope} ${payload.scopeId}`,
        metadata: { scope: payload.scope, scopeId: payload.scopeId, balanceKind: 'available' }
      })
      return transactionEscrows.create({
        ...payload,
        amount,
        remainingAmount: amount,
        currency,
        reference,
        businessId: companyId,
        source: 'company_wallet',
        status: 'funded'
      })
    })
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

  listPayouts(query: Record<string, unknown>, predicate: (record: Record<string, any>) => boolean = () => true) {
    return payouts.list(query, predicate)
  }

  updatePayout(id: string, patch: Record<string, any>) {
    return payouts.updateById(id, patch)
  }

  releaseEscrow(escrowId: string, payload: Record<string, any>) {
    return runPrismaRecordTransaction(async (createRepository, tx) => {
      await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', escrowId)
      const transactionEscrows = createRepository('escrows')
      const transactionPayouts = createRepository('payouts')
      const escrow = await transactionEscrows.findById(escrowId)
      if (!escrow) return null
      if (escrow.status === 'released' || escrow.status === 'refunded') {
        throw new ApiError(409, 'This escrow no longer has releasable funds', 'ESCROW_ALREADY_CLOSED')
      }
      const currency = normalizeCurrency(escrow.currency || 'KES')
      const amount = normalizeMoney(payload.amount, currency)
      const remaining = normalizeMoney(escrow.remainingAmount ?? escrow.amount, currency)
      if (amount <= 0 || amount > remaining) {
        throw new ApiError(409, 'Payout exceeds the funds remaining in escrow', 'ESCROW_AMOUNT_EXCEEDED', { amount, remaining, currency })
      }
      const nextRemaining = normalizeMoney(remaining - amount, currency)
      const reference = String(payload.reference || randomUUID())
      const payout = await transactionPayouts.create({
        escrowId: escrow.id,
        studentId: payload.studentId,
        amount,
        currency,
        reference: `escrow-release:${escrow.id}:${reference}`,
        status: 'paid',
        paidAt: new Date().toISOString()
      })
      await creditStudentWallet(tx, payload.studentId, amount, {
        currency,
        reference,
        description: `Escrow payout for ${escrow.scope} ${escrow.scopeId}`,
        metadata: { escrowId: escrow.id, payoutId: payout.id }
      })
      const updatedEscrow = await transactionEscrows.updateById(escrowId, {
        remainingAmount: nextRemaining,
        status: nextRemaining === 0 ? 'released' : 'partially_released',
        ...(nextRemaining === 0 ? { releasedAt: new Date().toISOString() } : {})
      })
      return { escrow: updatedEscrow, payout }
    })
  }
}

const financeLedgerRepository = new FinanceLedgerRepository()

export {
  FinanceLedgerRepository,
  financeLedgerRepository
}
