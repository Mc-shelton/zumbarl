import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { ApiError } from '../../../lib/http.js'
import { prisma } from '../../../lib/prisma.js'
import { debitCompanyWallet, getOrCreateCompanyWallet, getOrCreateStudentWallet } from '../../../shared/services/walletLedger.js'
import { normalizeCurrency, normalizeMoney } from '../../../shared/services/money.js'

type OpportunityStkInput = {
  opportunityId: string
  companyId: string
  actorId?: string
  amount: number
  currency: string
  phoneNumber: string
  reference?: string
  publishAfterFunding?: boolean
}

type StkCompletion = {
  resultCode: number
  resultDescription: string
  amount?: number | null
  phoneNumber?: string | null
  receipt?: string | null
  rawPayload: Record<string, any>
}

type StudentB2cInput = {
  studentId: string
  amount: number
  currency: string
  phoneNumber: string
  reference?: string
}

type B2cCompletion = {
  resultCode: number
  resultDescription: string
  receipt?: string | null
  rawPayload: Record<string, any>
}

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

function callbackTokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function paymentDto(payment: Record<string, any>) {
  return {
    id: payment.id,
    direction: payment.direction,
    purpose: payment.purpose,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    phoneNumber: payment.phoneNumber,
    opportunityId: payment.opportunityId,
    payoutId: payment.payoutId,
    accountReference: payment.accountReference,
    merchantRequestId: payment.merchantRequestId,
    checkoutRequestId: payment.checkoutRequestId,
    conversationId: payment.conversationId,
    providerReceipt: payment.providerReceipt,
    resultCode: payment.resultCode,
    resultDescription: payment.resultDescription,
    requestedAt: payment.requestedAt,
    lastQueriedAt: payment.lastQueriedAt,
    completedAt: payment.completedAt,
    failedAt: payment.failedAt,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt
  }
}

class MpesaPaymentsRepository {
  async prepareOpportunityStkRequest(input: OpportunityStkInput) {
    const reference = String(input.reference || randomUUID())
    const clientReference = `opportunity:${input.opportunityId}:${reference}`
    return prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', `opportunity-funding:${input.opportunityId}`)
      const opportunity = await tx.opportunity.findUnique({ where: { id: input.opportunityId } })
      if (!opportunity || opportunity.companyId !== input.companyId) return null
      const currency = normalizeCurrency(input.currency || opportunity.currency || 'KES')
      if (currency !== opportunity.currency) {
        throw new ApiError(400, `Funding for this opportunity must use ${opportunity.currency}.`, 'OPPORTUNITY_FUNDING_CURRENCY_MISMATCH')
      }
      const amount = normalizeMoney(input.amount, currency)
      const existing = await tx.mpesaPaymentRequest.findUnique({ where: { clientReference } })
      if (existing) return { payment: paymentDto(existing), created: false }
      const active = await tx.mpesaPaymentRequest.findFirst({
        where: {
          opportunityId: opportunity.id,
          direction: 'STK_PUSH',
          status: { in: ['PENDING', 'PROCESSING'] }
        },
        orderBy: { requestedAt: 'desc' }
      })
      if (active) return { payment: paymentDto(active), created: false }
      const funded = await tx.opportunityEscrowHold.aggregate({
        where: { opportunityId: opportunity.id, status: { in: ['FUNDED', 'HELD'] } },
        _sum: { amount: true }
      })
      const remaining = normalizeMoney(Math.max(0, opportunity.budgetAmount - Number(funded._sum.amount || 0)), currency)
      if (remaining === 0) {
        throw new ApiError(409, 'This opportunity is already fully funded.', 'OPPORTUNITY_ALREADY_FUNDED')
      }
      if (amount > remaining) {
        throw new ApiError(409, `This payment exceeds the ${currency} ${remaining.toLocaleString()} still required.`, 'OPPORTUNITY_OVERFUNDING', {
          requested: amount,
          remaining,
          currency
        })
      }
      const wallet = await getOrCreateCompanyWallet(tx, input.companyId)
      const ledgerReference = `mpesa-stk:${clientReference}`
      const transaction = await tx.transaction.create({
        data: {
          companyWalletId: wallet.id,
          type: 'COMPANY_PAYMENT',
          status: 'PENDING',
          amount,
          netAmount: amount,
          currency,
          reference: ledgerReference,
          mpesaDirection: 'STK_PUSH',
          description: `M-Pesa funding for ${opportunity.title}`,
          opportunityId: opportunity.id,
          metadata: json({ provider: 'mpesa', purpose: 'opportunity_escrow', clientReference })
        }
      })
      const accountReference = `ZMB${opportunity.id.replace(/[^a-z0-9]/gi, '').slice(-9)}`.slice(0, 12)
      const payment = await tx.mpesaPaymentRequest.create({
        data: {
          direction: 'STK_PUSH',
          purpose: 'OPPORTUNITY_ESCROW',
          status: 'PENDING',
          amount,
          currency,
          phoneNumber: input.phoneNumber,
          companyId: input.companyId,
          opportunityId: opportunity.id,
          clientReference,
          accountReference,
          callbackTokenHash: callbackTokenHash(randomBytes(32).toString('base64url')),
          transactionId: transaction.id,
          requestPayload: json({
            actorId: input.actorId || null,
            publishAfterFunding: Boolean(input.publishAfterFunding),
            reference,
            opportunityTitle: opportunity.title
          })
        }
      })
      return { payment: paymentDto(payment), created: true }
    })
  }

  async markStkProviderAccepted(id: string, providerResponse: Record<string, any>) {
    const payment = await prisma.mpesaPaymentRequest.update({
      where: { id },
      data: {
        status: 'PROCESSING',
        merchantRequestId: providerResponse.merchantRequestId || null,
        checkoutRequestId: providerResponse.checkoutRequestId,
        responsePayload: json(providerResponse)
      }
    })
    return paymentDto(payment)
  }

  async claimProviderInitiation(id: string) {
    return prisma.$transaction(async (tx) => {
      const token = randomBytes(32).toString('base64url')
      const claimed = await tx.mpesaPaymentRequest.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'PROCESSING', callbackTokenHash: callbackTokenHash(token) }
      })
      if (claimed.count !== 1) return null
      const payment = await tx.mpesaPaymentRequest.findUnique({ where: { id } })
      if (payment?.transactionId) {
        await tx.transaction.updateMany({
          where: { id: payment.transactionId, status: 'PENDING' },
          data: { status: 'PROCESSING' }
        })
      }
      return token
    })
  }

  async markProviderRequestFailed(id: string, reason: string, details: Record<string, any> = {}) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.mpesaPaymentRequest.findUnique({ where: { id } })
      if (!payment || payment.status === 'COMPLETED') return payment ? paymentDto(payment) : null
      const failed = await tx.mpesaPaymentRequest.update({
        where: { id },
        data: {
          status: 'FAILED',
          resultDescription: reason,
          failedAt: new Date(),
          responsePayload: json(details)
        }
      })
      if (payment.transactionId) {
        await tx.transaction.updateMany({
          where: { id: payment.transactionId, status: { in: ['PENDING', 'PROCESSING'] } },
          data: { status: 'FAILED', failedAt: new Date(), failureReason: reason }
        })
      }
      return paymentDto(failed)
    })
  }

  async noteProviderInitiationUncertain(id: string, reason: string, details: Record<string, any> = {}) {
    const payment = await prisma.mpesaPaymentRequest.update({
      where: { id },
      data: {
        status: 'PROCESSING',
        resultDescription: reason,
        responsePayload: json(details)
      }
    })
    return paymentDto(payment)
  }

  async findPayment(id: string) {
    const payment = await prisma.mpesaPaymentRequest.findUnique({ where: { id } })
    return payment ? paymentDto(payment) : null
  }

  async findPaymentWithSecrets(id: string) {
    return prisma.mpesaPaymentRequest.findUnique({ where: { id } })
  }

  async noteStkQuery(id: string, response: Record<string, any>) {
    const payment = await prisma.mpesaPaymentRequest.update({
      where: { id },
      data: { lastQueriedAt: new Date(), responsePayload: json(response) }
    })
    return paymentDto(payment)
  }

  async completeOpportunityStkRequest(id: string, completion: StkCompletion) {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', `mpesa-payment:${id}`)
      const payment = await tx.mpesaPaymentRequest.findUnique({ where: { id } })
      if (!payment) return null
      if (payment.status === 'COMPLETED') return { payment: paymentDto(payment), duplicate: true }
      if (payment.direction !== 'STK_PUSH' || payment.purpose !== 'OPPORTUNITY_ESCROW' || !payment.opportunityId || !payment.companyId) {
        throw new ApiError(409, 'This callback does not match an opportunity payment.', 'MPESA_PAYMENT_PURPOSE_MISMATCH')
      }
      await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', `opportunity-funding:${payment.opportunityId}`)

      if (completion.resultCode !== 0) {
        const failed = await tx.mpesaPaymentRequest.update({
          where: { id },
          data: {
            status: 'FAILED',
            resultCode: completion.resultCode,
            resultDescription: completion.resultDescription,
            callbackPayload: json(completion.rawPayload),
            failedAt: new Date()
          }
        })
        if (payment.transactionId) {
          await tx.transaction.updateMany({
            where: { id: payment.transactionId, status: { in: ['PENDING', 'PROCESSING'] } },
            data: { status: 'FAILED', failedAt: new Date(), failureReason: completion.resultDescription }
          })
        }
        return { payment: paymentDto(failed), duplicate: false }
      }

      const paidAmount = completion.amount == null ? null : normalizeMoney(completion.amount, payment.currency)
      if (paidAmount !== payment.amount || !completion.receipt) {
        throw new ApiError(409, 'The M-Pesa callback did not contain the expected amount and receipt.', 'MPESA_CALLBACK_MISMATCH', {
          expectedAmount: payment.amount,
          receivedAmount: paidAmount,
          hasReceipt: Boolean(completion.receipt)
        })
      }
      if (completion.phoneNumber && completion.phoneNumber !== payment.phoneNumber) {
        throw new ApiError(409, 'The M-Pesa callback phone number does not match the payment request.', 'MPESA_CALLBACK_PHONE_MISMATCH')
      }

      const opportunity = await tx.opportunity.findUnique({ where: { id: payment.opportunityId } })
      if (!opportunity || opportunity.companyId !== payment.companyId) {
        throw new ApiError(409, 'The funded opportunity no longer matches this payment.', 'MPESA_OPPORTUNITY_MISMATCH')
      }
      const wallet = await getOrCreateCompanyWallet(tx, payment.companyId)
      if (payment.transactionId) {
        await tx.companyWallet.update({ where: { id: wallet.id }, data: { balance: { increment: payment.amount } } })
        await tx.transaction.update({
          where: { id: payment.transactionId },
          data: {
            companyWalletId: wallet.id,
            status: 'COMPLETED',
            mpesaRef: completion.receipt,
            processedAt: new Date(),
            failureReason: null,
            failedAt: null,
            metadata: json({
              provider: 'mpesa',
              purpose: 'opportunity_escrow',
              mpesaPaymentRequestId: payment.id,
              checkoutRequestId: payment.checkoutRequestId
            })
          }
        })
      }

      const escrowReference = `mpesa:${payment.checkoutRequestId || payment.id}`
      let escrow = await tx.opportunityEscrowHold.findFirst({
        where: { opportunityId: opportunity.id, transactionRef: escrowReference }
      })
      if (!escrow) {
        await debitCompanyWallet(tx, payment.companyId, payment.amount, {
          type: 'ESCROW_HOLD',
          currency: payment.currency,
          reference: `opportunity-funding:${opportunity.id}:${escrowReference}`,
          opportunityId: opportunity.id,
          description: `Opportunity escrow funding: ${opportunity.title}`,
          metadata: { opportunityId: opportunity.id, mpesaPaymentRequestId: payment.id, balanceKind: 'available' }
        })
        escrow = await tx.opportunityEscrowHold.create({
          data: {
            opportunityId: opportunity.id,
            companyId: payment.companyId,
            amount: payment.amount,
            currency: payment.currency,
            status: 'FUNDED',
            transactionRef: escrowReference
          }
        })
      }

      const fundedHolds = await tx.opportunityEscrowHold.findMany({
        where: { opportunityId: opportunity.id, status: { in: ['FUNDED', 'HELD'] } },
        select: { amount: true }
      })
      const escrowCoverage = fundedHolds.reduce((total, hold) => total + Number(hold.amount || 0), 0)
      const requestPayload = payment.requestPayload && typeof payment.requestPayload === 'object' && !Array.isArray(payment.requestPayload)
        ? payment.requestPayload as Record<string, any>
        : {}
      const fullyFunded = escrowCoverage >= opportunity.budgetAmount
      const publishAfterFunding = fullyFunded && requestPayload.publishAfterFunding === true
      const updatedOpportunity = await tx.opportunity.update({
        where: { id: opportunity.id },
        data: {
          escrowStatus: fullyFunded ? 'funded' : 'partially_funded',
          ...(publishAfterFunding && opportunity.status !== 'published'
            ? { status: 'published', visibility: 'public', publishedAt: new Date() }
            : {})
        }
      })
      await tx.opportunityActivityEvent.create({
        data: {
          action: 'funded',
          opportunityId: opportunity.id,
          actorId: typeof requestPayload.actorId === 'string' ? requestPayload.actorId : undefined,
          metadata: json({ escrowId: escrow.id, amount: escrow.amount, currency: escrow.currency, provider: 'mpesa' })
        }
      })
      if (publishAfterFunding && opportunity.status !== 'published') {
        await tx.opportunityActivityEvent.create({
          data: {
            action: 'published',
            opportunityId: opportunity.id,
            actorId: typeof requestPayload.actorId === 'string' ? requestPayload.actorId : undefined,
            metadata: json({ provider: 'mpesa', paymentRequestId: payment.id })
          }
        })
      }
      const completed = await tx.mpesaPaymentRequest.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          resultCode: 0,
          resultDescription: completion.resultDescription,
          providerReceipt: completion.receipt,
          callbackPayload: json(completion.rawPayload),
          completedAt: new Date(),
          failedAt: null
        }
      })
      return {
        payment: paymentDto(completed),
        opportunity: {
          id: updatedOpportunity.id,
          status: updatedOpportunity.status,
          escrowStatus: updatedOpportunity.escrowStatus
        },
        escrow,
        duplicate: false
      }
    })
  }

  async prepareStudentB2cRequest(input: StudentB2cInput) {
    const reference = String(input.reference || randomUUID())
    const clientReference = `student-withdrawal:${input.studentId}:${reference}`
    return prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', `student-withdrawal:${input.studentId}`)
      const student = await tx.studentProfile.findUnique({ where: { id: input.studentId } })
      if (!student) return null
      const currency = normalizeCurrency(input.currency || 'KES')
      const amount = normalizeMoney(input.amount, currency)
      const existing = await tx.mpesaPaymentRequest.findUnique({ where: { clientReference } })
      if (existing) return { payment: paymentDto(existing), created: false }
      const active = await tx.mpesaPaymentRequest.findFirst({
        where: {
          studentId: input.studentId,
          direction: 'B2C',
          status: { in: ['PENDING', 'PROCESSING'] }
        },
        orderBy: { requestedAt: 'desc' }
      })
      if (active) return { payment: paymentDto(active), created: false }
      const wallet = await getOrCreateStudentWallet(tx, input.studentId)
      if (wallet.currency !== currency) {
        throw new ApiError(409, 'Wallet currency does not match this payout.', 'WALLET_CURRENCY_MISMATCH')
      }
      const reserved = await tx.wallet.updateMany({
        where: { id: wallet.id, balance: { gte: amount } },
        data: { balance: { decrement: amount } }
      })
      if (reserved.count !== 1) {
        throw new ApiError(409, 'Your wallet balance is not enough for this withdrawal.', 'INSUFFICIENT_WALLET_BALANCE', {
          requested: amount,
          available: wallet.balance,
          currency
        })
      }
      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'STUDENT_PAYOUT',
          status: 'PENDING',
          amount: -amount,
          netAmount: -amount,
          currency,
          reference: `mpesa-b2c:${clientReference}`,
          mpesaDirection: 'B2C',
          description: 'M-Pesa wallet withdrawal',
          metadata: json({ provider: 'mpesa', purpose: 'wallet_withdrawal', clientReference })
        }
      })
      const payment = await tx.mpesaPaymentRequest.create({
        data: {
          direction: 'B2C',
          purpose: 'WALLET_WITHDRAWAL',
          status: 'PENDING',
          amount,
          currency,
          phoneNumber: input.phoneNumber,
          studentId: input.studentId,
          clientReference,
          accountReference: `ZMB${student.id.replace(/[^a-z0-9]/gi, '').slice(-9)}`.slice(0, 12),
          callbackTokenHash: callbackTokenHash(randomBytes(32).toString('base64url')),
          transactionId: transaction.id,
          requestPayload: json({ reference })
        }
      })
      return { payment: paymentDto(payment), created: true }
    })
  }

  async markB2cProviderAccepted(id: string, providerResponse: Record<string, any>) {
    const payment = await prisma.mpesaPaymentRequest.update({
      where: { id },
      data: {
        status: 'PROCESSING',
        conversationId: providerResponse.conversationId,
        originatorConversationId: providerResponse.originatorConversationId || null,
        responsePayload: json(providerResponse)
      }
    })
    return paymentDto(payment)
  }

  async completeStudentB2cRequest(id: string, completion: B2cCompletion) {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', `mpesa-payment:${id}`)
      const payment = await tx.mpesaPaymentRequest.findUnique({ where: { id } })
      if (!payment) return null
      if (['COMPLETED', 'FAILED', 'REVERSED'].includes(payment.status)) {
        return { payment: paymentDto(payment), duplicate: true }
      }
      if (payment.direction !== 'B2C' || payment.purpose !== 'WALLET_WITHDRAWAL' || !payment.studentId || !payment.transactionId) {
        throw new ApiError(409, 'This callback does not match a student withdrawal.', 'MPESA_PAYMENT_PURPOSE_MISMATCH')
      }
      const transaction = await tx.transaction.findUnique({ where: { id: payment.transactionId } })
      if (!transaction?.walletId) {
        throw new ApiError(409, 'The withdrawal ledger entry is missing.', 'MPESA_WITHDRAWAL_LEDGER_MISSING')
      }
      if (completion.resultCode === 0) {
        if (!completion.receipt) {
          throw new ApiError(409, 'The M-Pesa payout result did not contain a transaction receipt.', 'MPESA_PAYOUT_RECEIPT_MISSING')
        }
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
            mpesaRef: completion.receipt,
            processedAt: new Date(),
            failedAt: null,
            failureReason: null
          }
        })
        const completed = await tx.mpesaPaymentRequest.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            resultCode: 0,
            resultDescription: completion.resultDescription,
            providerReceipt: completion.receipt,
            callbackPayload: json(completion.rawPayload),
            completedAt: new Date(),
            failedAt: null
          }
        })
        return { payment: paymentDto(completed), duplicate: false }
      }

      await tx.wallet.update({ where: { id: transaction.walletId }, data: { balance: { increment: payment.amount } } })
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          failureReason: completion.resultDescription
        }
      })
      await tx.transaction.create({
        data: {
          walletId: transaction.walletId,
          type: 'ESCROW_REFUND',
          status: 'COMPLETED',
          amount: payment.amount,
          netAmount: payment.amount,
          currency: payment.currency,
          reference: `mpesa-b2c-refund:${payment.id}`,
          mpesaDirection: 'B2C',
          description: 'Failed M-Pesa withdrawal returned to wallet',
          processedAt: new Date(),
          metadata: json({ mpesaPaymentRequestId: payment.id, failedTransactionId: transaction.id })
        }
      })
      const failed = await tx.mpesaPaymentRequest.update({
        where: { id },
        data: {
          status: 'FAILED',
          resultCode: completion.resultCode,
          resultDescription: completion.resultDescription,
          callbackPayload: json(completion.rawPayload),
          failedAt: new Date()
        }
      })
      return { payment: paymentDto(failed), duplicate: false, refunded: true }
    })
  }
}

const mpesaPaymentsRepository = new MpesaPaymentsRepository()

export {
  MpesaPaymentsRepository,
  callbackTokenHash,
  mpesaPaymentsRepository,
  paymentDto,
  type B2cCompletion,
  type StkCompletion
}
