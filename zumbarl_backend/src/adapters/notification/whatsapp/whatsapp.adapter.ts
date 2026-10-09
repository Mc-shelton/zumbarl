import { Buffer } from 'node:buffer'
import { env } from '../../../config/env.js'

type TwilioMessageResponse = {
  code?: number | null
  error_code?: number | null
  error_message?: string | null
  message?: string | null
  sid?: string
  status?: string
}

function whatsappAddress(phoneNumber: string) {
  const normalized = phoneNumber.trim().replace(/^whatsapp:/i, '')
  return { address: `whatsapp:${normalized}`, number: normalized }
}

function failure(phoneNumber: string, templateName: string, error: string, providerStatus?: string, retryable = false) {
  return {
    provider: env.WHATSAPP_PROVIDER,
    senderId: env.WHATSAPP_SENDER_ID,
    phoneNumber,
    templateName,
    status: 'failed' as const,
    providerStatus,
    retryable,
    error
  }
}

async function sendWhatsappTemplate(phoneNumber: string, templateName: string, variables: Record<string, string>) {
  const recipient = whatsappAddress(phoneNumber)
  const sender = whatsappAddress(env.WHATSAPP_SENDER_ID)

  if (env.WHATSAPP_PROVIDER === 'disabled') {
    return {
      provider: env.WHATSAPP_PROVIDER,
      senderId: sender.address,
      phoneNumber: recipient.number,
      templateName,
      status: 'skipped' as const
    }
  }
  if (!/^\+[1-9]\d{7,14}$/.test(recipient.number)) {
    return failure(recipient.number, templateName, 'WhatsApp recipient must use E.164 format')
  }
  if (!/^\+[1-9]\d{7,14}$/.test(sender.number)) {
    return failure(recipient.number, templateName, 'Configured WhatsApp sender must use E.164 format')
  }
  if (!/^HX[0-9a-fA-F]{32}$/.test(templateName)) {
    return failure(recipient.number, templateName, 'Twilio WhatsApp template must be a Content SID')
  }
  if (!env.WHATSAPP_ACCOUNT_SID) {
    return failure(recipient.number, templateName, 'Twilio Account SID is not configured')
  }

  const form = new URLSearchParams({
    From: sender.address,
    To: recipient.address,
    ContentSid: templateName,
    ContentVariables: JSON.stringify(variables)
  })

  try {
    const response = await globalThis.fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(env.WHATSAPP_ACCOUNT_SID)}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${Buffer.from(`${env.WHATSAPP_ACCOUNT_SID}:${env.WHATSAPP_ACCESS_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: form,
        signal: globalThis.AbortSignal.timeout(env.HTTP_REQUEST_TIMEOUT_MS)
      }
    )
    const payload = await response.json().catch(() => ({})) as TwilioMessageResponse

    if (!response.ok || payload.error_code || payload.code) {
      return failure(
        recipient.number,
        templateName,
        payload.error_message || payload.message || `Twilio rejected the request with HTTP ${response.status}`,
        payload.status,
        response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500
      )
    }

    return {
      provider: env.WHATSAPP_PROVIDER,
      senderId: sender.address,
      phoneNumber: recipient.number,
      templateName,
      status: 'accepted' as const,
      providerStatus: payload.status,
      messageId: payload.sid
    }
  } catch (error) {
    return failure(
      recipient.number,
      templateName,
      error instanceof Error ? error.message : 'Unable to reach Twilio',
      undefined,
      true
    )
  }
}

export {
  sendWhatsappTemplate
}
