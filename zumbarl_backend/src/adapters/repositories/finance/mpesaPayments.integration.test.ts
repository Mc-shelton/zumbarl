import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '../../../lib/prisma.js'
import { mpesaPaymentsRepository } from './mpesaPayments.repository.js'

const marker = `mpesa-funding-${process.pid}-${Date.now()}`
const companyId = `${marker}-company`
const opportunityId = `${marker}-opportunity`
const campusId = `${marker}-campus`
const courseId = `${marker}-course`
const userId = `${marker}-user`
const studentId = `${marker}-student`
let paymentId = ''

beforeAll(async () => {
  await prisma.campus.create({ data: { id: campusId, name: 'M-Pesa Test Campus', city: 'Nairobi' } })
  await prisma.course.create({ data: { id: courseId, name: 'M-Pesa Test Course', category: 'BUSINESS', duration: 4 } })
  await prisma.user.create({
    data: {
      id: userId,
      email: `${userId}@example.test`,
      phone: '254711111111',
      passwordHash: 'test-only',
      role: 'STUDENT_TRANSITION',
      isVerified: true
    }
  })
  await prisma.studentProfile.create({
    data: {
      id: studentId,
      userId,
      firstName: 'Payout',
      lastName: 'Student',
      dateOfBirth: new Date('2000-01-01'),
      campusId,
      courseId,
      yearJoined: 2024,
      courseDuration: 4,
      expectedGraduation: new Date('2028-12-01'),
      kycStatus: 'APPROVED'
    }
  })
  await prisma.wallet.create({ data: { studentId, type: 'MAIN', balance: 3000, pendingBalance: 0, currency: 'KES' } })
  await prisma.company.create({
    data: {
      id: companyId,
      name: 'M-Pesa Integration Test Company',
      registrationNumber: `${marker}-registration`,
      sector: 'Technology',
      size: 'SMALL',
      kycStatus: 'APPROVED'
    }
  })
  await prisma.opportunity.create({
    data: {
      id: opportunityId,
      companyId,
      title: 'M-Pesa funded campaign',
      summary: 'Proves that confirmed provider money enters escrow exactly once.',
      opportunityType: 'gig',
      status: 'draft',
      visibility: 'draft',
      budgetAmount: 1250,
      budgetLabel: 'KES 1,250',
      currency: 'KES',
      escrowStatus: 'unfunded'
    }
  })
})

afterAll(async () => {
  await prisma.opportunityActivityEvent.deleteMany({ where: { opportunityId } })
  await prisma.opportunityEscrowHold.deleteMany({ where: { opportunityId } })
  await prisma.mpesaPaymentRequest.deleteMany({ where: { opportunityId } })
  await prisma.transaction.deleteMany({ where: { opportunityId } })
  await prisma.opportunity.deleteMany({ where: { id: opportunityId } })
  await prisma.companyWallet.deleteMany({ where: { companyId } })
  await prisma.company.deleteMany({ where: { id: companyId } })
  await prisma.mpesaPaymentRequest.deleteMany({ where: { studentId } })
  await prisma.transaction.deleteMany({ where: { wallet: { studentId } } })
  await prisma.wallet.deleteMany({ where: { studentId } })
  await prisma.studentProfile.deleteMany({ where: { id: studentId } })
  await prisma.user.deleteMany({ where: { id: userId } })
  await prisma.campus.deleteMany({ where: { id: campusId } })
  await prisma.course.deleteMany({ where: { id: courseId } })
  await prisma.$disconnect()
})

describe('M-Pesa opportunity funding ledger', () => {
  it('converts one verified callback into one escrow hold and remains idempotent', async () => {
    const prepared = await mpesaPaymentsRepository.prepareOpportunityStkRequest({
      opportunityId,
      companyId,
      actorId: `${marker}-actor`,
      amount: 1250,
      currency: 'KES',
      phoneNumber: '254712345678',
      reference: `${marker}-reference`,
      publishAfterFunding: true
    })
    expect(prepared).toBeTruthy()
    paymentId = prepared!.payment.id
    const duplicatePreparation = await mpesaPaymentsRepository.prepareOpportunityStkRequest({
      opportunityId,
      companyId,
      amount: 1250,
      currency: 'KES',
      phoneNumber: '254712345678',
      reference: `${marker}-different-browser-retry`
    })
    expect(duplicatePreparation?.payment.id).toBe(paymentId)
    expect(await mpesaPaymentsRepository.claimProviderInitiation(paymentId)).toMatch(/^[A-Za-z0-9_-]{40,}$/)
    expect(await mpesaPaymentsRepository.claimProviderInitiation(paymentId)).toBeNull()
    await mpesaPaymentsRepository.markStkProviderAccepted(paymentId, {
      merchantRequestId: `${marker}-merchant`,
      checkoutRequestId: `${marker}-checkout`,
      responseCode: '0'
    })

    const callback = {
      Body: {
        stkCallback: {
          MerchantRequestID: `${marker}-merchant`,
          CheckoutRequestID: `${marker}-checkout`,
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: 1250 },
              { Name: 'MpesaReceiptNumber', Value: `${marker}-receipt` },
              { Name: 'PhoneNumber', Value: 254712345678 }
            ]
          }
        }
      }
    }
    const completion = {
      resultCode: 0,
      resultDescription: 'The service request is processed successfully.',
      amount: 1250,
      receipt: `${marker}-receipt`,
      phoneNumber: '254712345678',
      rawPayload: callback
    }
    const first = await mpesaPaymentsRepository.completeOpportunityStkRequest(paymentId, completion)
    const repeated = await mpesaPaymentsRepository.completeOpportunityStkRequest(paymentId, completion)

    expect(first?.payment).toMatchObject({ status: 'COMPLETED', providerReceipt: `${marker}-receipt` })
    expect(first?.opportunity).toMatchObject({ status: 'published', escrowStatus: 'funded' })
    expect(repeated).toMatchObject({ duplicate: true })
    expect(await prisma.opportunityEscrowHold.count({ where: { opportunityId } })).toBe(1)
    expect(await prisma.transaction.count({ where: { opportunityId } })).toBe(2)
    expect(await prisma.transaction.count({ where: { opportunityId, status: 'COMPLETED', mpesaRef: `${marker}-receipt` } })).toBe(1)
    expect(await prisma.companyWallet.findUnique({ where: { companyId } })).toMatchObject({ balance: 0 })
  })

  it('reserves a B2C withdrawal once and finalizes the matching receipt', async () => {
    const prepared = await mpesaPaymentsRepository.prepareStudentB2cRequest({
      studentId,
      amount: 700,
      currency: 'KES',
      phoneNumber: '254712345678',
      reference: `${marker}-successful-withdrawal`
    })
    expect(prepared).toBeTruthy()
    const requestId = prepared!.payment.id
    expect(await mpesaPaymentsRepository.claimProviderInitiation(requestId)).toMatch(/^[A-Za-z0-9_-]{40,}$/)
    await mpesaPaymentsRepository.markB2cProviderAccepted(requestId, {
      conversationId: `${marker}-conversation-success`,
      originatorConversationId: `${marker}-originator-success`,
      responseCode: '0'
    })
    const first = await mpesaPaymentsRepository.completeStudentB2cRequest(requestId, {
      resultCode: 0,
      resultDescription: 'The service request is processed successfully.',
      receipt: `${marker}-b2c-receipt`,
      rawPayload: { Result: { ResultCode: 0 } }
    })
    const repeated = await mpesaPaymentsRepository.completeStudentB2cRequest(requestId, {
      resultCode: 0,
      resultDescription: 'The service request is processed successfully.',
      receipt: `${marker}-b2c-receipt`,
      rawPayload: { Result: { ResultCode: 0 } }
    })
    expect(first?.payment).toMatchObject({ status: 'COMPLETED', providerReceipt: `${marker}-b2c-receipt` })
    expect(repeated).toMatchObject({ duplicate: true })
    expect(await prisma.wallet.findUnique({ where: { studentId_type: { studentId, type: 'MAIN' } } })).toMatchObject({ balance: 2300 })
  })

  it('returns a failed B2C withdrawal to the wallet exactly once', async () => {
    const prepared = await mpesaPaymentsRepository.prepareStudentB2cRequest({
      studentId,
      amount: 500,
      currency: 'KES',
      phoneNumber: '254712345678',
      reference: `${marker}-failed-withdrawal`
    })
    expect(prepared).toBeTruthy()
    const requestId = prepared!.payment.id
    expect(await mpesaPaymentsRepository.claimProviderInitiation(requestId)).toMatch(/^[A-Za-z0-9_-]{40,}$/)
    await mpesaPaymentsRepository.markB2cProviderAccepted(requestId, {
      conversationId: `${marker}-conversation-failed`,
      originatorConversationId: `${marker}-originator-failed`,
      responseCode: '0'
    })
    const first = await mpesaPaymentsRepository.completeStudentB2cRequest(requestId, {
      resultCode: 1,
      resultDescription: 'The balance is insufficient for the transaction.',
      rawPayload: { Result: { ResultCode: 1 } }
    })
    const repeated = await mpesaPaymentsRepository.completeStudentB2cRequest(requestId, {
      resultCode: 1,
      resultDescription: 'The balance is insufficient for the transaction.',
      rawPayload: { Result: { ResultCode: 1 } }
    })
    expect(first).toMatchObject({ refunded: true, payment: { status: 'FAILED' } })
    expect(repeated).toMatchObject({ duplicate: true })
    expect(await prisma.wallet.findUnique({ where: { studentId_type: { studentId, type: 'MAIN' } } })).toMatchObject({ balance: 2300 })
    expect(await prisma.transaction.count({
      where: { wallet: { studentId }, reference: `mpesa-b2c-refund:${requestId}` }
    })).toBe(1)
  })
})
