import { env } from '../../../config/env.js'

type MpesaPaymentRequest = {
  amount: number
  phoneNumber: string
  accountReference: string
  transactionDescription: string
}

type MpesaPayoutRequest = {
  amount: number
  phoneNumber: string
  remarks: string
}

async function requestMpesaStkPush(payment: MpesaPaymentRequest) {
  return {
    provider: 'mpesa',
    mode: 'adapter',
    baseUrl: env.MPESA_BASE_URL,
    shortCode: env.MPESA_SHORT_CODE,
    status: 'queued',
    payment
  }
}

async function requestMpesaB2cPayout(payout: MpesaPayoutRequest) {
  return {
    provider: 'mpesa',
    mode: 'adapter',
    baseUrl: env.MPESA_BASE_URL,
    shortCode: env.MPESA_SHORT_CODE,
    status: 'queued',
    payout
  }
}

export {
  requestMpesaStkPush,
  requestMpesaB2cPayout,
  type MpesaPaymentRequest,
  type MpesaPayoutRequest
}
