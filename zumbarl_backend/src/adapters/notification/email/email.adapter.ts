import { env } from '../../../config/env.js'

async function sendTransactionalEmail(to: string, subject: string, html: string) {
  return {
    provider: env.EMAIL_PROVIDER,
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    status: env.EMAIL_PROVIDER === 'disabled' ? 'skipped' : 'queued'
  }
}

export {
  sendTransactionalEmail
}
