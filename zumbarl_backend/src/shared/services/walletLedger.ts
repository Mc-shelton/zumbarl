import type { CompanyWallet, Prisma, PrismaClient, TransactionType, Wallet } from '@prisma/client'
import { ApiError } from '../../lib/http.js'
import { prisma } from '../../lib/prisma.js'
import { normalizeCurrency, normalizeMoney } from './money.js'

type WalletClient = Pick<PrismaClient, 'wallet' | 'companyWallet' | 'transaction'>

type StudentWalletDto = {
  id: string
  studentId: string
  type: string
  currency: string
  balance: number
  availableBalance: number
  pendingBalance: number
}

type CompanyWalletDto = {
  id: string
  companyId: string
  currency: string
  balance: number
  availableBalance: number
}

type LedgerMeta = {
  description?: string
  opportunityId?: string | null
  metadata?: Record<string, unknown>
  currency?: string
  reference?: string
  type?: TransactionType
}

type CreditMeta = LedgerMeta & { releasePendingAmount?: number }

function mapStudentWallet(wallet: Wallet | null): StudentWalletDto | null {
  if (!wallet) return null
  return {
    id: wallet.id,
    studentId: wallet.studentId,
    type: wallet.type,
    currency: wallet.currency,
    balance: wallet.balance,
    availableBalance: wallet.balance,
    pendingBalance: wallet.pendingBalance
  }
}

function mapCompanyWallet(wallet: CompanyWallet | null): CompanyWalletDto | null {
  if (!wallet) return null
  return {
    id: wallet.id,
    companyId: wallet.companyId,
    currency: wallet.currency,
    balance: wallet.balance,
    availableBalance: wallet.balance
  }
}

async function getOrCreateStudentWallet(client: WalletClient, studentId: string): Promise<Wallet> {
  return client.wallet.upsert({
    where: { studentId_type: { studentId, type: 'MAIN' } },
    update: {},
    create: { studentId, type: 'MAIN', balance: 0, pendingBalance: 0, currency: 'KES' }
  })
}

async function getOrCreateCompanyWallet(client: WalletClient, companyId: string): Promise<CompanyWallet> {
  return client.companyWallet.upsert({
    where: { companyId },
    update: {},
    create: { companyId, balance: 0, currency: 'KES' }
  })
}

function assertCurrency(walletCurrency: string, requestedCurrency: string) {
  if (walletCurrency !== requestedCurrency) {
    throw new ApiError(409, 'Wallet currency does not match this payment', 'WALLET_CURRENCY_MISMATCH', { walletCurrency, requestedCurrency })
  }
}

function transactionData(meta: LedgerMeta, defaults: { amount: number; currency: string; description: string; type: TransactionType }) {
  return {
    type: meta.type ?? defaults.type,
    status: 'COMPLETED' as const,
    amount: defaults.amount,
    netAmount: defaults.amount,
    currency: defaults.currency,
    description: meta.description ?? defaults.description,
    opportunityId: meta.opportunityId ?? null,
    processedAt: new Date(),
    ...(meta.reference ? { reference: meta.reference } : {}),
    ...(meta.metadata ? { metadata: meta.metadata as Prisma.InputJsonValue } : {})
  }
}

async function debitStudentWallet(client: WalletClient, studentId: string, amountValue: unknown, meta: LedgerMeta = {}): Promise<Wallet> {
  const currency = normalizeCurrency(meta.currency || 'KES')
  const amount = normalizeMoney(amountValue, currency)
  if (amount <= 0) throw new ApiError(400, 'Payment amount must be positive', 'INVALID_MONEY_AMOUNT')
  const wallet = await getOrCreateStudentWallet(client, studentId)
  assertCurrency(wallet.currency, currency)
  const debited = await client.wallet.updateMany({ where: { id: wallet.id, balance: { gte: amount } }, data: { balance: { decrement: amount } } })
  if (debited.count !== 1) {
    throw new ApiError(409, 'Your wallet balance is not enough to complete this payment', 'INSUFFICIENT_WALLET_BALANCE', { required: amount, available: wallet.balance, currency })
  }
  await client.transaction.create({ data: { walletId: wallet.id, ...transactionData(meta, { amount: -amount, currency, description: 'Wallet payment', type: 'COMPANY_PAYMENT' }) } })
  return client.wallet.findUniqueOrThrow({ where: { id: wallet.id } })
}

async function debitCompanyWallet(client: WalletClient, companyId: string, amountValue: unknown, meta: LedgerMeta = {}): Promise<CompanyWallet> {
  const currency = normalizeCurrency(meta.currency || 'KES')
  const amount = normalizeMoney(amountValue, currency)
  if (amount <= 0) throw new ApiError(400, 'Payment amount must be positive', 'INVALID_MONEY_AMOUNT')
  const wallet = await getOrCreateCompanyWallet(client, companyId)
  assertCurrency(wallet.currency, currency)
  const debited = await client.companyWallet.updateMany({ where: { id: wallet.id, balance: { gte: amount } }, data: { balance: { decrement: amount } } })
  if (debited.count !== 1) {
    throw new ApiError(409, 'The company wallet balance is not enough to fund this payment', 'INSUFFICIENT_COMPANY_WALLET_BALANCE', { required: amount, available: wallet.balance, currency })
  }
  await client.transaction.create({ data: { companyWalletId: wallet.id, ...transactionData(meta, { amount: -amount, currency, description: 'Company wallet payment', type: 'COMPANY_PAYMENT' }) } })
  return client.companyWallet.findUniqueOrThrow({ where: { id: wallet.id } })
}

async function reserveStudentPending(client: WalletClient, studentId: string, amountValue: unknown, meta: LedgerMeta = {}): Promise<Wallet> {
  const currency = normalizeCurrency(meta.currency || 'KES')
  const amount = normalizeMoney(amountValue, currency)
  if (amount <= 0) throw new ApiError(400, 'Escrow amount must be positive', 'INVALID_MONEY_AMOUNT')
  const wallet = await getOrCreateStudentWallet(client, studentId)
  assertCurrency(wallet.currency, currency)
  const updated = await client.wallet.update({ where: { id: wallet.id }, data: { pendingBalance: { increment: amount } } })
  await client.transaction.create({ data: { walletId: wallet.id, ...transactionData(meta, { amount, currency, description: 'Funds reserved in escrow', type: 'ESCROW_HOLD' }) } })
  return updated
}

async function removeStudentPending(client: WalletClient, studentId: string, amountValue: unknown, meta: LedgerMeta = {}): Promise<Wallet> {
  const currency = normalizeCurrency(meta.currency || 'KES')
  const amount = normalizeMoney(amountValue, currency)
  if (amount <= 0) throw new ApiError(400, 'Escrow amount must be positive', 'INVALID_MONEY_AMOUNT')
  const wallet = await getOrCreateStudentWallet(client, studentId)
  assertCurrency(wallet.currency, currency)
  const removed = await client.wallet.updateMany({ where: { id: wallet.id, pendingBalance: { gte: amount } }, data: { pendingBalance: { decrement: amount } } })
  if (removed.count !== 1) {
    throw new ApiError(409, 'Reserved wallet balance is inconsistent', 'ESCROW_PENDING_BALANCE_MISMATCH', { required: amount, pending: wallet.pendingBalance, currency })
  }
  await client.transaction.create({ data: { walletId: wallet.id, ...transactionData(meta, { amount: -amount, currency, description: 'Escrow reservation removed', type: 'ESCROW_REFUND' }) } })
  return client.wallet.findUniqueOrThrow({ where: { id: wallet.id } })
}

async function creditStudentWallet(client: WalletClient, studentId: string, amountValue: unknown, meta: CreditMeta = {}): Promise<Wallet> {
  const currency = normalizeCurrency(meta.currency || 'KES')
  const amount = normalizeMoney(amountValue, currency)
  const releasePendingAmount = normalizeMoney(meta.releasePendingAmount || 0, currency)
  if (amount <= 0) throw new ApiError(400, 'Payout amount must be positive', 'INVALID_MONEY_AMOUNT')
  if (releasePendingAmount < 0 || releasePendingAmount > amount) throw new ApiError(400, 'Pending release cannot exceed the wallet credit', 'INVALID_ESCROW_RELEASE')
  const wallet = await getOrCreateStudentWallet(client, studentId)
  assertCurrency(wallet.currency, currency)
  if (releasePendingAmount > 0) {
    const released = await client.wallet.updateMany({ where: { id: wallet.id, pendingBalance: { gte: releasePendingAmount } }, data: { balance: { increment: amount }, pendingBalance: { decrement: releasePendingAmount } } })
    if (released.count !== 1) {
      throw new ApiError(409, 'Reserved wallet balance is inconsistent', 'ESCROW_PENDING_BALANCE_MISMATCH', { required: releasePendingAmount, pending: wallet.pendingBalance, currency })
    }
  } else {
    await client.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: amount } } })
  }
  await client.transaction.create({ data: { walletId: wallet.id, ...transactionData(meta, { amount, currency, description: 'Student payout', type: 'STUDENT_PAYOUT' }) } })
  return client.wallet.findUniqueOrThrow({ where: { id: wallet.id } })
}

async function refundStudentWallet(client: WalletClient, studentId: string, amountValue: unknown, meta: LedgerMeta = {}): Promise<Wallet> {
  return creditStudentWallet(client, studentId, amountValue, { ...meta, type: 'ESCROW_REFUND' })
}

async function readStudentWallet(studentId: string): Promise<StudentWalletDto | null> {
  return mapStudentWallet(await prisma.wallet.findUnique({ where: { studentId_type: { studentId, type: 'MAIN' } } }))
}

async function readCompanyWallet(companyId: string): Promise<CompanyWalletDto | null> {
  return mapCompanyWallet(await prisma.companyWallet.findUnique({ where: { companyId } }))
}

export {
  creditStudentWallet,
  debitCompanyWallet,
  debitStudentWallet,
  getOrCreateCompanyWallet,
  getOrCreateStudentWallet,
  mapCompanyWallet,
  mapStudentWallet,
  readCompanyWallet,
  readStudentWallet,
  refundStudentWallet,
  removeStudentPending,
  reserveStudentPending,
  type CompanyWalletDto,
  type StudentWalletDto,
  type WalletClient
}
