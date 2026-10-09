import { Buffer } from 'node:buffer'
import { timingSafeEqual } from 'node:crypto'
import { env, isPublicHttpsUrl } from '../../../config/env.js'
import { ApiError, forbidden, notFound } from '../../../lib/http.js'
import { roleGroups, type AuthUser } from '../../../lib/security.js'
import { deleteCacheByPattern } from '../../cache/index.js'
import {
  MpesaProviderError,
  normalizeKenyanPhoneNumber,
  queryMpesaStkPush,
  requestMpesaB2cPayout,
  requestMpesaStkPush
} from '../../payment/index.js'
import { callbackTokenHash, mpesaPaymentsRepository } from '../../repositories/finance/index.js'

function assertMpesaEnabled() {
  if (env.MPESA_PROVIDER !== 'daraja') {
    throw new ApiError(503, 'M-Pesa is disabled for this deployment.', 'MPESA_PROVIDER_DISABLED')
  }
}

function callbackBaseUrl() {
  assertMpesaEnabled()
  const baseUrl = new URL(env.MPESA_CALLBACK_BASE_URL || env.SERVER_PUBLIC_URL)
  if (!isPublicHttpsUrl(baseUrl.toString())) {
    throw new ApiError(503, 'M-Pesa callbacks require a public HTTPS URL.', 'MPESA_CALLBACK_URL_NOT_PUBLIC')
  }
  return baseUrl.toString().replace(/\/$/, '')
}

function providerApiError(error: unknown) {
  if (error instanceof MpesaProviderError) {
    return new ApiError(error.statusCode, error.message, String(error.details.code || 'MPESA_PROVIDER_ERROR'), error.details)
  }
  return new ApiError(502, 'M-Pesa could not start this payment.', 'MPESA_PROVIDER_ERROR')
}

function safelyMatchesToken(token: string, expectedHash: string) {
  const actual = Buffer.from(callbackTokenHash(token))
  const expected = Buffer.from(expectedHash)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

function callbackMetadata(stkCallback: Record<string, any>) {
  const items = Array.isArray(stkCallback.CallbackMetadata?.Item)
    ? stkCallback.CallbackMetadata.Item
    : []
  const values = new Map(items.map((item: Record<string, any>) => [String(item.Name || ''), item.Value]))
  return {
    amount: values.has('Amount') ? Number(values.get('Amount')) : null,
    receipt: values.has('MpesaReceiptNumber') ? String(values.get('MpesaReceiptNumber')) : null,
    phoneNumber: values.has('PhoneNumber') ? String(values.get('PhoneNumber')) : null
  }
}

function isPendingStkQueryResponse(response: Record<string, any>) {
  const resultCode = Number(response.ResultCode)
  const description = String(response.ResultDesc || response.ResponseDescription || '')
  return resultCode === 4999 && /(?:still\s+under\s+processing|still\s+processing|being\s+processed|pending)/i.test(description)
}

function b2cResultMetadata(result: Record<string, any>) {
  const items = Array.isArray(result.ResultParameters?.ResultParameter)
    ? result.ResultParameters.ResultParameter
    : []
  const values = new Map(items.map((item: Record<string, any>) => [String(item.Key || ''), item.Value]))
  return {
    amount: values.has('TransactionAmount') ? Number(values.get('TransactionAmount')) : null,
    receipt: values.has('TransactionReceipt')
      ? String(values.get('TransactionReceipt'))
      : result.TransactionID ? String(result.TransactionID) : null,
    receiver: values.has('ReceiverPartyPublicName') ? String(values.get('ReceiverPartyPublicName')) : null
  }
}

async function initiateOpportunityMpesaFundingService(
  opportunityId: string,
  businessId: string,
  payload: Record<string, any>,
  actorId?: string
) {
  assertMpesaEnabled()
  let phoneNumber: string
  try {
    phoneNumber = normalizeKenyanPhoneNumber(payload.phoneNumber)
  } catch (error) {
    throw providerApiError(error)
  }
  const prepared = await mpesaPaymentsRepository.prepareOpportunityStkRequest({
    opportunityId,
    companyId: businessId,
    actorId,
    amount: payload.amount,
    currency: payload.currency || 'KES',
    phoneNumber,
    reference: payload.reference,
    publishAfterFunding: payload.publishAfterFunding
  }) ?? notFound('Opportunity')
  if (prepared.payment.status !== 'PENDING') {
    return { payment: prepared.payment }
  }
  const callbackToken = await mpesaPaymentsRepository.claimProviderInitiation(prepared.payment.id)
  if (!callbackToken) return { payment: await mpesaPaymentsRepository.findPayment(prepared.payment.id) }

  const callbackUrl = `${callbackBaseUrl()}/api/v1/finance/mpesa/stk/callback/${prepared.payment.id}/${callbackToken}`
  try {
    const providerResponse = await requestMpesaStkPush({
      amount: prepared.payment.amount,
      phoneNumber,
      accountReference: prepared.payment.accountReference,
      transactionDescription: 'Zumbarl escrow funding',
      callbackUrl
    })
    const payment = await mpesaPaymentsRepository.markStkProviderAccepted(prepared.payment.id, providerResponse)
    return {
      payment,
      customerMessage: providerResponse.customerMessage || 'Check your phone and enter your M-Pesa PIN.'
    }
  } catch (error) {
    const apiError = providerApiError(error)
    if (error instanceof MpesaProviderError && error.details.outcomeUnknown === true) {
      const payment = await mpesaPaymentsRepository.noteProviderInitiationUncertain(
        prepared.payment.id,
        'Safaricom has not yet confirmed whether the STK request was accepted. Do not pay again while this request is processing.',
        { code: error.details.code || 'MPESA_OUTCOME_UNKNOWN' }
      )
      return { payment, customerMessage: payment.resultDescription, outcomeUnknown: true }
    }
    await mpesaPaymentsRepository.markProviderRequestFailed(prepared.payment.id, apiError.message, apiError.details as Record<string, any>)
    throw apiError
  }
}

function assertPaymentAccess(payment: Record<string, any>, actor: AuthUser | undefined) {
  const ownsCompanyPayment = Boolean(actor?.businessId && actor.businessId === payment.companyId)
  const ownsStudentPayment = Boolean(actor?.studentId && actor.studentId === payment.studentId)
  const isFinance = Boolean(actor && roleGroups.finance.includes(actor.role))
  if (!ownsCompanyPayment && !ownsStudentPayment && !isFinance) forbidden('You do not have access to this payment')
}

async function readMpesaPaymentService(id: string, actor: AuthUser | undefined) {
  const paymentWithOwner = await mpesaPaymentsRepository.findPaymentWithSecrets(id) ?? notFound('M-Pesa payment')
  assertPaymentAccess(paymentWithOwner, actor)
  return { payment: await mpesaPaymentsRepository.findPayment(id) }
}

async function initiateStudentMpesaPayoutService(
  studentId: string | undefined,
  payload: Record<string, any>
) {
  assertMpesaEnabled()
  if (!studentId) throw new ApiError(403, 'A student wallet is required for withdrawal.', 'STUDENT_WALLET_REQUIRED')
  let phoneNumber: string
  try {
    phoneNumber = normalizeKenyanPhoneNumber(payload.phoneNumber)
  } catch (error) {
    throw providerApiError(error)
  }
  const prepared = await mpesaPaymentsRepository.prepareStudentB2cRequest({
    studentId,
    amount: payload.amount,
    currency: payload.currency || 'KES',
    phoneNumber,
    reference: payload.reference
  }) ?? notFound('Student')
  if (prepared.payment.status !== 'PENDING') {
    return { payment: prepared.payment }
  }
  const callbackToken = await mpesaPaymentsRepository.claimProviderInitiation(prepared.payment.id)
  if (!callbackToken) return { payment: await mpesaPaymentsRepository.findPayment(prepared.payment.id) }
  const callbackPrefix = `${callbackBaseUrl()}/api/v1/finance/mpesa/b2c`
  try {
    const providerResponse = await requestMpesaB2cPayout({
      amount: prepared.payment.amount,
      phoneNumber,
      remarks: 'Zumbarl wallet withdrawal',
      occasion: prepared.payment.accountReference,
      resultUrl: `${callbackPrefix}/result/${prepared.payment.id}/${callbackToken}`,
      timeoutUrl: `${callbackPrefix}/timeout/${prepared.payment.id}/${callbackToken}`
    })
    const payment = await mpesaPaymentsRepository.markB2cProviderAccepted(prepared.payment.id, providerResponse)
    return { payment }
  } catch (error) {
    const apiError = providerApiError(error)
    if (error instanceof MpesaProviderError && error.details.outcomeUnknown === true) {
      const payment = await mpesaPaymentsRepository.noteProviderInitiationUncertain(
        prepared.payment.id,
        'Safaricom has not yet confirmed the payout. The amount remains reserved until a result or timeout callback arrives.',
        { code: error.details.code || 'MPESA_OUTCOME_UNKNOWN' }
      )
      return { payment, outcomeUnknown: true }
    }
    await mpesaPaymentsRepository.completeStudentB2cRequest(prepared.payment.id, {
      resultCode: -1,
      resultDescription: apiError.message,
      rawPayload: { providerError: apiError.code, details: apiError.details || null }
    })
    throw apiError
  }
}

async function reconcileMpesaPaymentService(id: string, actor: AuthUser | undefined) {
  assertMpesaEnabled()
  const payment = await mpesaPaymentsRepository.findPaymentWithSecrets(id) ?? notFound('M-Pesa payment')
  assertPaymentAccess(payment, actor)
  if (payment.status !== 'PROCESSING' || payment.direction !== 'STK_PUSH' || !payment.checkoutRequestId) {
    return { payment: await mpesaPaymentsRepository.findPayment(id) }
  }
  try {
    const response = await queryMpesaStkPush(payment.checkoutRequestId)
    await mpesaPaymentsRepository.noteStkQuery(id, response)
    const resultCode = Number(response.ResultCode)
    if (isPendingStkQueryResponse(response)) {
      return { payment: await mpesaPaymentsRepository.findPayment(id), awaitingCustomer: true }
    }
    if (Number.isFinite(resultCode) && resultCode !== 0) {
      const result = await mpesaPaymentsRepository.completeOpportunityStkRequest(id, {
        resultCode,
        resultDescription: String(response.ResultDesc || response.ResponseDescription || 'M-Pesa payment failed.'),
        rawPayload: response
      })
      return result || { payment: await mpesaPaymentsRepository.findPayment(id) }
    }
    if (resultCode === 0) {
      // Safaricom may lose or delay the callback even though its authenticated
      // checkout query confirms success. The checkout ID is unique and was
      // matched above, so it is safe to finalize idempotently; a late callback
      // will add the provider receipt without replaying the ledger transaction.
      const result = await mpesaPaymentsRepository.completeOpportunityStkRequest(id, {
        resultCode: 0,
        resultDescription: String(response.ResultDesc || response.ResponseDescription || 'M-Pesa payment completed.'),
        amount: payment.amount,
        phoneNumber: payment.phoneNumber,
        receipt: null,
        confirmationSource: 'query',
        rawPayload: response
      })
      return result || { payment: await mpesaPaymentsRepository.findPayment(id) }
    }
    return { payment: await mpesaPaymentsRepository.findPayment(id) }
  } catch (error) {
    throw providerApiError(error)
  }
}

async function handleMpesaStkCallbackService(id: string, token: string, payload: Record<string, any>) {
  assertMpesaEnabled()
  const payment = await mpesaPaymentsRepository.findPaymentWithSecrets(id) ?? notFound('M-Pesa payment')
  if (!safelyMatchesToken(token, payment.callbackTokenHash)) {
    throw new ApiError(401, 'Invalid M-Pesa callback token.', 'INVALID_MPESA_CALLBACK_TOKEN')
  }
  const callback = payload.Body?.stkCallback
  if (!callback || typeof callback !== 'object') {
    throw new ApiError(400, 'Invalid M-Pesa callback payload.', 'INVALID_MPESA_CALLBACK')
  }
  if (payment.checkoutRequestId && String(callback.CheckoutRequestID || '') !== payment.checkoutRequestId) {
    throw new ApiError(409, 'M-Pesa checkout reference does not match this payment.', 'MPESA_CHECKOUT_MISMATCH')
  }
  if (payment.merchantRequestId && String(callback.MerchantRequestID || '') !== payment.merchantRequestId) {
    throw new ApiError(409, 'M-Pesa merchant reference does not match this payment.', 'MPESA_MERCHANT_MISMATCH')
  }
  const metadata = callbackMetadata(callback)
  const result = await mpesaPaymentsRepository.completeOpportunityStkRequest(id, {
    resultCode: Number(callback.ResultCode),
    resultDescription: String(callback.ResultDesc || ''),
    amount: metadata.amount,
    receipt: metadata.receipt,
    phoneNumber: metadata.phoneNumber,
    rawPayload: payload
  }) ?? notFound('M-Pesa payment')
  if (payment.companyId) {
    await deleteCacheByPattern(`business-dashboard:*:${payment.companyId}`)
  }
  return result
}

async function handleMpesaB2cResultService(id: string, token: string, payload: Record<string, any>) {
  assertMpesaEnabled()
  const payment = await mpesaPaymentsRepository.findPaymentWithSecrets(id) ?? notFound('M-Pesa payment')
  if (!safelyMatchesToken(token, payment.callbackTokenHash)) {
    throw new ApiError(401, 'Invalid M-Pesa callback token.', 'INVALID_MPESA_CALLBACK_TOKEN')
  }
  const result = payload.Result
  if (!result || typeof result !== 'object') {
    throw new ApiError(400, 'Invalid M-Pesa B2C result payload.', 'INVALID_MPESA_CALLBACK')
  }
  if (payment.conversationId && String(result.ConversationID || '') !== payment.conversationId) {
    throw new ApiError(409, 'M-Pesa payout conversation does not match this request.', 'MPESA_CONVERSATION_MISMATCH')
  }
  if (payment.originatorConversationId && String(result.OriginatorConversationID || '') !== payment.originatorConversationId) {
    throw new ApiError(409, 'M-Pesa payout originator reference does not match this request.', 'MPESA_ORIGINATOR_MISMATCH')
  }
  const metadata = b2cResultMetadata(result)
  if (Number(result.ResultCode) === 0) {
    if (metadata.amount == null || metadata.amount !== payment.amount) {
      throw new ApiError(409, 'M-Pesa payout amount does not match this withdrawal.', 'MPESA_PAYOUT_AMOUNT_MISMATCH')
    }
    const receiverPhone = metadata.receiver?.match(/254(?:1|7)\d{8}/)?.[0]
    if (receiverPhone && receiverPhone !== payment.phoneNumber) {
      throw new ApiError(409, 'M-Pesa payout recipient does not match this withdrawal.', 'MPESA_PAYOUT_PHONE_MISMATCH')
    }
  }
  return await mpesaPaymentsRepository.completeStudentB2cRequest(id, {
    resultCode: Number(result.ResultCode),
    resultDescription: String(result.ResultDesc || ''),
    receipt: metadata.receipt,
    rawPayload: payload
  }) ?? notFound('M-Pesa payment')
}

async function handleMpesaB2cTimeoutService(id: string, token: string, payload: Record<string, any>) {
  assertMpesaEnabled()
  const payment = await mpesaPaymentsRepository.findPaymentWithSecrets(id) ?? notFound('M-Pesa payment')
  if (!safelyMatchesToken(token, payment.callbackTokenHash)) {
    throw new ApiError(401, 'Invalid M-Pesa callback token.', 'INVALID_MPESA_CALLBACK_TOKEN')
  }
  return await mpesaPaymentsRepository.completeStudentB2cRequest(id, {
    resultCode: Number(payload.Result?.ResultCode ?? -1),
    resultDescription: String(payload.Result?.ResultDesc || 'M-Pesa payout timed out before confirmation.'),
    rawPayload: payload
  }) ?? notFound('M-Pesa payment')
}

export {
  assertMpesaEnabled,
  callbackBaseUrl,
  callbackMetadata,
  b2cResultMetadata,
  handleMpesaB2cResultService,
  handleMpesaB2cTimeoutService,
  handleMpesaStkCallbackService,
  initiateOpportunityMpesaFundingService,
  initiateStudentMpesaPayoutService,
  isPendingStkQueryResponse,
  readMpesaPaymentService,
  reconcileMpesaPaymentService,
  safelyMatchesToken
}
