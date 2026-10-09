import { env } from '../../../config/env.js'

type AfricasTalkingRecipient = {
  cost?: string
  messageId?: string
  number?: string
  status?: string
  statusCode?: number
}

type AfricasTalkingResponse = {
  SMSMessageData?: {
    Message?: string
    Recipients?: AfricasTalkingRecipient[]
  }
}

function failure(phoneNumber: string, error: string, providerStatus?: string, retryable = false) {
  return {
    provider: env.SMS_PROVIDER,
    phoneNumber,
    status: 'failed' as const,
    providerStatus,
    retryable,
    error
  }
}

async function readProviderResponse(response: Response) {
  const body = await response.text()
  if (!body) return {} as AfricasTalkingResponse
  try {
    return JSON.parse(body) as AfricasTalkingResponse
  } catch {
    return {} as AfricasTalkingResponse
  }
}

async function sendSmsMessage(phoneNumber: string, message: string) {
  const recipient = phoneNumber.trim()
  const content = message.trim()

  if (env.SMS_PROVIDER === 'disabled') {
    return { provider: env.SMS_PROVIDER, phoneNumber: recipient, status: 'skipped' as const }
  }
  if (!/^\+[1-9]\d{7,14}$/.test(recipient)) {
    return failure(recipient, 'SMS recipient must use E.164 format')
  }
  if (!content) return failure(recipient, 'SMS message cannot be empty')

  const endpoint = env.SMS_USERNAME === 'sandbox'
    ? 'https://api.sandbox.africastalking.com/version1/messaging'
    : 'https://api.africastalking.com/version1/messaging'
  const form = new URLSearchParams({
    username: env.SMS_USERNAME,
    to: recipient,
    message: content
  })

  try {
    const response = await globalThis.fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        apiKey: env.SMS_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form,
      signal: globalThis.AbortSignal.timeout(env.HTTP_REQUEST_TIMEOUT_MS)
    })
    const payload = await readProviderResponse(response)
    const delivery = payload.SMSMessageData?.Recipients?.[0]

    if (!response.ok) {
      return failure(
        recipient,
        payload.SMSMessageData?.Message || `Africa's Talking rejected the request with HTTP ${response.status}`,
        delivery?.status,
        response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500
      )
    }
    if (!delivery || (delivery.statusCode !== 101 && delivery.status?.toLowerCase() !== 'success')) {
      return failure(
        recipient,
        payload.SMSMessageData?.Message || delivery?.status || `Africa's Talking did not accept the recipient`,
        delivery?.status
      )
    }

    return {
      provider: env.SMS_PROVIDER,
      phoneNumber: recipient,
      status: 'accepted' as const,
      providerStatus: delivery.status,
      messageId: delivery.messageId,
      cost: delivery.cost
    }
  } catch (error) {
    return failure(
      recipient,
      error instanceof Error ? error.message : `Unable to reach Africa's Talking`,
      undefined,
      true
    )
  }
}

export {
  sendSmsMessage
}
