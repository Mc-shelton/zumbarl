import { Buffer } from 'node:buffer'
import { env } from '../../../config/env.js'

type MpesaPaymentRequest = {
  amount: number
  phoneNumber: string
  accountReference: string
  transactionDescription: string
  callbackUrl: string
}

type MpesaPayoutRequest = {
  amount: number
  phoneNumber: string
  remarks: string
  occasion?: string
  resultUrl: string
  timeoutUrl: string
}

type MpesaJson = Record<string, any>

class MpesaProviderError extends Error {
  statusCode: number
  details: MpesaJson

  constructor(message: string, statusCode = 502, details: MpesaJson = {}) {
    super(message)
    this.name = 'MpesaProviderError'
    this.statusCode = statusCode
    this.details = details
  }
}

let tokenCache: { token: string, expiresAt: number } | null = null

function normalizeKenyanPhoneNumber(value: unknown) {
  const digits = String(value || '').replace(/\D/g, '')
  const normalized = digits.startsWith('0') ? `254${digits.slice(1)}` : digits
  if (!/^254(?:1|7)\d{8}$/.test(normalized)) {
    throw new MpesaProviderError('Enter a valid Kenyan Safaricom number, for example 0712345678.', 400, {
      code: 'INVALID_MPESA_PHONE'
    })
  }
  return normalized
}

function mpesaTimestamp(date = new Date()) {
  return new Date(date.getTime() + 3 * 60 * 60 * 1000)
    .toISOString()
    .replace(/\D/g, '')
    .slice(0, 14)
}

async function parseProviderResponse(response: Response): Promise<MpesaJson> {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text) as MpesaJson
  } catch {
    return { rawResponse: text.slice(0, 500) }
  }
}

async function mpesaFetch(path: string, init: RequestInit, accessToken?: string) {
  const controller = new AbortController()
  const timer = globalThis.setTimeout(() => controller.abort(), env.MPESA_REQUEST_TIMEOUT_MS)
  try {
    const response = await globalThis.fetch(`${env.MPESA_BASE_URL.replace(/\/$/, '')}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init.headers
      }
    })
    const body = await parseProviderResponse(response)
    if (!response.ok) {
      throw new MpesaProviderError(
        body.errorMessage || body.ResponseDescription || body.responseDesc || `M-Pesa returned HTTP ${response.status}.`,
        502,
        { providerStatus: response.status, providerCode: body.errorCode || body.ResponseCode || null }
      )
    }
    return body
  } catch (error) {
    if (error instanceof MpesaProviderError) throw error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new MpesaProviderError('M-Pesa did not respond in time. Check the payment status before trying again.', 504, {
        code: 'MPESA_TIMEOUT'
      })
    }
    throw new MpesaProviderError('M-Pesa is currently unreachable. Try again after checking the payment status.', 502, {
      code: 'MPESA_UNREACHABLE'
    })
  } finally {
    globalThis.clearTimeout(timer)
  }
}

async function getMpesaAccessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) return tokenCache.token
  const credentials = Buffer.from(`${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`).toString('base64')
  const response = await mpesaFetch('/oauth/v1/generate?grant_type=client_credentials', {
    method: 'GET',
    headers: { Authorization: `Basic ${credentials}` }
  })
  const token = String(response.access_token || '')
  if (!token) {
    throw new MpesaProviderError('M-Pesa authorization did not return an access token.', 502, {
      code: 'MPESA_AUTH_TOKEN_MISSING'
    })
  }
  const expiresIn = Math.max(60, Number(response.expires_in || 3599))
  tokenCache = { token, expiresAt: Date.now() + expiresIn * 1000 }
  return token
}

function stkCredentials() {
  const timestamp = mpesaTimestamp()
  const password = Buffer.from(`${env.MPESA_SHORT_CODE}${env.MPESA_PASSKEY}${timestamp}`).toString('base64')
  return { password, timestamp }
}

async function requestMpesaStkPush(payment: MpesaPaymentRequest) {
  const accessToken = await getMpesaAccessToken()
  const phoneNumber = normalizeKenyanPhoneNumber(payment.phoneNumber)
  const { password, timestamp } = stkCredentials()
  let response: MpesaJson
  try {
    response = await mpesaFetch('/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      body: JSON.stringify({
        BusinessShortCode: env.MPESA_SHORT_CODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(payment.amount),
        PartyA: phoneNumber,
        PartyB: env.MPESA_SHORT_CODE,
        PhoneNumber: phoneNumber,
        CallBackURL: payment.callbackUrl,
        AccountReference: payment.accountReference.slice(0, 12),
        TransactionDesc: payment.transactionDescription.slice(0, 30)
      })
    }, accessToken)
  } catch (error) {
    if (error instanceof MpesaProviderError && ['MPESA_TIMEOUT', 'MPESA_UNREACHABLE'].includes(String(error.details.code))) {
      error.details.outcomeUnknown = true
    }
    throw error
  }
  if (String(response.ResponseCode) !== '0' || !response.CheckoutRequestID) {
    throw new MpesaProviderError(response.ResponseDescription || 'M-Pesa did not accept the STK request.', 502, {
      providerCode: response.ResponseCode || null
    })
  }
  return {
    merchantRequestId: String(response.MerchantRequestID || ''),
    checkoutRequestId: String(response.CheckoutRequestID),
    responseCode: String(response.ResponseCode),
    responseDescription: String(response.ResponseDescription || ''),
    customerMessage: String(response.CustomerMessage || '')
  }
}

async function queryMpesaStkPush(checkoutRequestId: string) {
  const accessToken = await getMpesaAccessToken()
  const { password, timestamp } = stkCredentials()
  return mpesaFetch('/mpesa/stkpushquery/v1/query', {
    method: 'POST',
    body: JSON.stringify({
      BusinessShortCode: env.MPESA_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    })
  }, accessToken)
}

async function requestMpesaB2cPayout(payout: MpesaPayoutRequest) {
  if (!env.MPESA_INITIATOR_NAME || !env.MPESA_SECURITY_CREDENTIAL) {
    throw new MpesaProviderError('M-Pesa B2C credentials are not configured.', 503, {
      code: 'MPESA_B2C_NOT_CONFIGURED'
    })
  }
  const accessToken = await getMpesaAccessToken()
  const phoneNumber = normalizeKenyanPhoneNumber(payout.phoneNumber)
  let response: MpesaJson
  try {
    response = await mpesaFetch('/mpesa/b2c/v1/paymentrequest', {
      method: 'POST',
      body: JSON.stringify({
        InitiatorName: env.MPESA_INITIATOR_NAME,
        SecurityCredential: env.MPESA_SECURITY_CREDENTIAL,
        CommandID: 'BusinessPayment',
        Amount: Math.round(payout.amount),
        PartyA: env.MPESA_B2C_SHORT_CODE || env.MPESA_SHORT_CODE,
        PartyB: phoneNumber,
        Remarks: payout.remarks.slice(0, 100),
        QueueTimeOutURL: payout.timeoutUrl,
        ResultURL: payout.resultUrl,
        Occasion: (payout.occasion || 'Zumbarl payout').slice(0, 100)
      })
    }, accessToken)
  } catch (error) {
    if (error instanceof MpesaProviderError && ['MPESA_TIMEOUT', 'MPESA_UNREACHABLE'].includes(String(error.details.code))) {
      error.details.outcomeUnknown = true
    }
    throw error
  }
  if (String(response.ResponseCode) !== '0' || !response.ConversationID) {
    throw new MpesaProviderError(response.ResponseDescription || 'M-Pesa did not accept the payout request.', 502, {
      providerCode: response.ResponseCode || null
    })
  }
  return {
    conversationId: String(response.ConversationID),
    originatorConversationId: String(response.OriginatorConversationID || ''),
    responseCode: String(response.ResponseCode),
    responseDescription: String(response.ResponseDescription || '')
  }
}

function clearMpesaTokenCache() {
  tokenCache = null
}

export {
  MpesaProviderError,
  clearMpesaTokenCache,
  getMpesaAccessToken,
  mpesaTimestamp,
  normalizeKenyanPhoneNumber,
  queryMpesaStkPush,
  requestMpesaStkPush,
  requestMpesaB2cPayout,
  type MpesaPaymentRequest,
  type MpesaPayoutRequest
}
