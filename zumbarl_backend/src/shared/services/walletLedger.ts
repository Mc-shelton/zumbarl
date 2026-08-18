import type { Prisma, PrismaClient, Wallet } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

// Any Prisma client that can reach the wallet + transaction delegates — the
// base client or a $transaction client, so credits stay atomic with the
// surrounding workflow.
type WalletClient = Pick<PrismaClient, 'wallet' | 'transaction'>

type StudentWalletDto = {
  id: string
  studentId: string
  type: string
  currency: string
  balance: number
  // Alias kept for existing consumers that still read `availableBalance`.
  availableBalance: number
  pendingBalance: number
}

type CreditMeta = {
  description?: string
  opportunityId?: string | null
  metadata?: Record<string, unknown>
}

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

async function getOrCreateStudentWallet(client: WalletClient, studentId: string): Promise<Wallet> {
  const existing = await client.wallet.findFirst({ where: { studentId, type: 'MAIN' } })
  if (existing) return existing
  return client.wallet.create({
    data: { studentId, type: 'MAIN', balance: 0, pendingBalance: 0, currency: 'KES' }
  })
}

/**
 * Credit a student's MAIN wallet by `amount`, drawing down any pending
 * (in-escrow) balance, and record a matching Transaction. Runs against the
 * provided client so it can share the caller's transaction.
 */
async function creditStudentWallet(
  client: WalletClient,
  studentId: string,
  amount: number,
  meta: CreditMeta = {}
): Promise<Wallet> {
  const wallet = await getOrCreateStudentWallet(client, studentId)
  const nextPending = Math.max(0, wallet.pendingBalance - amount)
  const updated = await client.wallet.update({
    where: { id: wallet.id },
    data: { balance: { increment: amount }, pendingBalance: nextPending }
  })
  await client.transaction.create({
    data: {
      walletId: wallet.id,
      type: 'STUDENT_PAYOUT',
      status: 'COMPLETED',
      amount,
      netAmount: amount,
      currency: wallet.currency,
      description: meta.description ?? 'Student payout',
      opportunityId: meta.opportunityId ?? null,
      processedAt: new Date(),
      ...(meta.metadata ? { metadata: meta.metadata as Prisma.InputJsonValue } : {})
    }
  })
  return updated
}

async function readStudentWallet(studentId: string): Promise<StudentWalletDto | null> {
  const wallet = await prisma.wallet.findFirst({ where: { studentId, type: 'MAIN' } })
  return mapStudentWallet(wallet)
}

export {
  creditStudentWallet,
  getOrCreateStudentWallet,
  mapStudentWallet,
  readStudentWallet,
  type StudentWalletDto,
  type WalletClient
}
