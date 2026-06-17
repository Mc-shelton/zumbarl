import { env } from '../../../config/env.js'

async function sendWhatsappTemplate(phoneNumber: string, templateName: string, variables: Record<string, string>) {
  return {
    provider: env.WHATSAPP_PROVIDER,
    senderId: env.WHATSAPP_SENDER_ID,
    phoneNumber,
    templateName,
    variables,
    status: env.WHATSAPP_PROVIDER === 'disabled' ? 'skipped' : 'queued'
  }
}

export {
  sendWhatsappTemplate
}
