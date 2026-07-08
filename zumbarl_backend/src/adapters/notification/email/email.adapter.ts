import { env } from '../../../config/env.js'

async function sendTransactionalEmail(to: string, subject: string, html: string) {
  const message = {
    provider: env.EMAIL_PROVIDER,
    from: env.EMAIL_FROM,
    to,
    subject,
    html
  }

  if (env.EMAIL_PROVIDER === 'disabled') {
    return {
      ...message,
      status: 'skipped'
    }
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.EMAIL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: env.EMAIL_FROM },
        subject,
        content: [{ type: 'text/html', value: html }]
      }),
      signal: AbortSignal.timeout(10_000)
    })

    if (!response.ok) {
      return {
        ...message,
        status: 'failed',
        error: `SendGrid rejected the email with status ${response.status}`
      }
    }

    return {
      ...message,
      status: 'sent'
    }
  } catch (error) {
    return {
      ...message,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unable to reach SendGrid'
    }
  }
}

export {
  sendTransactionalEmail
}
