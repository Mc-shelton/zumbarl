import { env } from '../../../config/env.js'

async function sendSmsMessage(phoneNumber: string, message: string) {
  return {
    provider: env.SMS_PROVIDER,
    phoneNumber,
    message,
    status: env.SMS_PROVIDER === 'disabled' ? 'skipped' : 'queued'
  }
}

export {
  sendSmsMessage
}
