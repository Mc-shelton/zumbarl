import nodemailer, { type Transporter } from 'nodemailer'
import { env } from '../../../config/env.js'

let smtpTransporter: Transporter | null = null

function getSmtpTransporter() {
  if (!smtpTransporter) {
    const hasCredentials = Boolean(env.MAIL_USER && env.MAIL_PASS)
    smtpTransporter = nodemailer.createTransport({
      host: env.MAIL_HOST,
      port: env.MAIL_PORT,
      secure: env.MAIL_SECURE ?? env.MAIL_PORT === 465,
      auth: hasCredentials
        ? { user: env.MAIL_USER, pass: env.MAIL_PASS }
        : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000
    })
  }
  return smtpTransporter
}

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
    const result = await getSmtpTransporter().sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html
    })

    return {
      ...message,
      status: 'sent',
      messageId: result.messageId
    }
  } catch (error) {
    return {
      ...message,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unable to send email through SMTP'
    }
  }
}

export {
  sendTransactionalEmail
}
