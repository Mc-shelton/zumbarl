import { afterEach, describe, expect, it, vi } from 'vitest'
import { callbackTokenHash, mpesaPaymentsRepository } from '../../repositories/finance/index.js'
import {
  handleMpesaB2cResultService,
  handleMpesaStkCallbackService
} from './manageMpesaPaymentsService.js'

afterEach(() => vi.restoreAllMocks())

describe('M-Pesa callback verification', () => {
  it('rejects an invalid callback token before touching the ledger', async () => {
    vi.spyOn(mpesaPaymentsRepository, 'findPaymentWithSecrets').mockResolvedValue({
      id: 'payment-1',
      callbackTokenHash: callbackTokenHash('correct-token-value-with-enough-entropy')
    } as never)
    const complete = vi.spyOn(mpesaPaymentsRepository, 'completeOpportunityStkRequest')

    await expect(handleMpesaStkCallbackService('payment-1', 'wrong-token-value-with-enough-entropy', {
      Body: { stkCallback: { ResultCode: 0 } }
    })).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_MPESA_CALLBACK_TOKEN' })
    expect(complete).not.toHaveBeenCalled()
  })

  it('accepts a matching STK receipt and passes normalized evidence to the ledger', async () => {
    const token = 'correct-token-value-with-enough-entropy'
    vi.spyOn(mpesaPaymentsRepository, 'findPaymentWithSecrets').mockResolvedValue({
      id: 'payment-1',
      callbackTokenHash: callbackTokenHash(token),
      companyId: null,
      merchantRequestId: 'merchant-1',
      checkoutRequestId: 'checkout-1'
    } as never)
    const complete = vi.spyOn(mpesaPaymentsRepository, 'completeOpportunityStkRequest')
      .mockResolvedValue({ payment: { id: 'payment-1', status: 'COMPLETED' }, duplicate: false } as never)

    await handleMpesaStkCallbackService('payment-1', token, {
      Body: {
        stkCallback: {
          MerchantRequestID: 'merchant-1',
          CheckoutRequestID: 'checkout-1',
          ResultCode: 0,
          ResultDesc: 'Success',
          CallbackMetadata: { Item: [
            { Name: 'Amount', Value: 1250 },
            { Name: 'MpesaReceiptNumber', Value: 'TESTRECEIPT' },
            { Name: 'PhoneNumber', Value: 254712345678 }
          ] }
        }
      }
    })

    expect(complete).toHaveBeenCalledWith('payment-1', expect.objectContaining({
      amount: 1250,
      phoneNumber: '254712345678',
      receipt: 'TESTRECEIPT',
      resultCode: 0
    }))
  })

  it('rejects a successful B2C callback whose amount does not match the withdrawal', async () => {
    const token = 'correct-token-value-with-enough-entropy'
    vi.spyOn(mpesaPaymentsRepository, 'findPaymentWithSecrets').mockResolvedValue({
      id: 'payout-1',
      amount: 700,
      phoneNumber: '254712345678',
      callbackTokenHash: callbackTokenHash(token),
      conversationId: 'conversation-1',
      originatorConversationId: 'originator-1'
    } as never)
    const complete = vi.spyOn(mpesaPaymentsRepository, 'completeStudentB2cRequest')

    await expect(handleMpesaB2cResultService('payout-1', token, {
      Result: {
        ResultCode: 0,
        ResultDesc: 'Success',
        ConversationID: 'conversation-1',
        OriginatorConversationID: 'originator-1',
        ResultParameters: { ResultParameter: [
          { Key: 'TransactionAmount', Value: 701 },
          { Key: 'TransactionReceipt', Value: 'B2CRECEIPT' },
          { Key: 'ReceiverPartyPublicName', Value: '254712345678 - Student' }
        ] }
      }
    })).rejects.toMatchObject({ statusCode: 409, code: 'MPESA_PAYOUT_AMOUNT_MISMATCH' })
    expect(complete).not.toHaveBeenCalled()
  })
})
