import type { Prisma } from '@prisma/client'
import { ApiError } from '../../lib/http.js'
import { addMoney, fromMinorUnits, normalizeCurrency, normalizeMoney, toMinorUnits } from './money.js'

async function readOpportunityEscrowBalance(client: Prisma.TransactionClient, opportunityId: string, currency?: string) {
  const normalizedCurrency = currency ? normalizeCurrency(currency) : undefined
  const holds = await client.opportunityEscrowHold.findMany({
    where: { opportunityId, status: { in: ['FUNDED', 'HELD'] }, ...(normalizedCurrency ? { currency: normalizedCurrency } : {}) },
    select: { amount: true, currency: true }
  })
  return addMoney(holds.map((hold) => hold.amount), normalizedCurrency || holds[0]?.currency || 'KES')
}

async function consumeOpportunityEscrow(
  client: Prisma.TransactionClient,
  opportunityId: string,
  amountValue: unknown,
  options: { currency?: string; studentId?: string | null; releaseReference: string }
) {
  const currency = normalizeCurrency(options.currency || 'KES')
  const amount = normalizeMoney(amountValue, currency)
  if (amount <= 0) return { amount: 0, currency, allocations: [] }

  await client.$executeRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', `opportunity-escrow:${opportunityId}`)

  const holds = await client.opportunityEscrowHold.findMany({
    where: { opportunityId, status: { in: ['FUNDED', 'HELD'] }, currency },
    orderBy: { heldAt: 'asc' }
  })
  const available = addMoney(holds.map((hold) => hold.amount), currency)
  if (toMinorUnits(available, currency) < toMinorUnits(amount, currency)) {
    throw new ApiError(409, 'Funded escrow is not enough for this payout', 'ESCROW_BALANCE_INSUFFICIENT', { opportunityId, required: amount, available, currency })
  }

  let remainingMinor = toMinorUnits(amount, currency)
  const allocations: Array<{ holdId: string; amount: number }> = []
  const releasedAt = new Date()
  for (let index = 0; index < holds.length && remainingMinor > 0; index += 1) {
    const hold = holds[index]
    const holdMinor = toMinorUnits(hold.amount, currency)
    const usedMinor = Math.min(holdMinor, remainingMinor)
    const used = fromMinorUnits(usedMinor, currency)
    const leftoverMinor = holdMinor - usedMinor
    if (leftoverMinor === 0) {
      await client.opportunityEscrowHold.update({
        where: { id: hold.id },
        data: { status: 'RELEASED', studentId: options.studentId || null, releasedAt }
      })
    } else {
      await client.opportunityEscrowHold.update({
        where: { id: hold.id },
        data: { amount: fromMinorUnits(leftoverMinor, currency) }
      })
      await client.opportunityEscrowHold.create({
        data: {
          opportunityId: hold.opportunityId,
          companyId: hold.companyId,
          studentId: options.studentId || null,
          amount: used,
          currency,
          status: 'RELEASED',
          heldAt: hold.heldAt,
          releasedAt,
          transactionRef: `${options.releaseReference}:${index + 1}`
        }
      })
    }
    allocations.push({ holdId: hold.id, amount: used })
    remainingMinor -= usedMinor
  }

  const remainingBalance = await readOpportunityEscrowBalance(client, opportunityId, currency)
  await client.opportunity.update({
    where: { id: opportunityId },
    data: { escrowStatus: remainingBalance > 0 ? 'partially_released' : 'released' }
  })
  return { amount, currency, allocations, remainingBalance }
}

export { consumeOpportunityEscrow, readOpportunityEscrowBalance }
