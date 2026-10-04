import { beforeEach, describe, expect, it, vi } from 'vitest'

const mailMocks = vi.hoisted(() => ({
  sendMail: vi.fn()
}))

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: mailMocks.sendMail }))
  }
}))

import nodemailer from 'nodemailer'
import { env } from '../../../config/env.js'
import { sendTransactionalEmail } from './email.adapter.js'

beforeEach(() => {
  vi.clearAllMocks()
  env.EMAIL_PROVIDER = 'smtp'
  mailMocks.sendMail.mockResolvedValue({ messageId: 'smtp-message-1' })
})

describe('SMTP email adapter', () => {
  it('sends transactional HTML email through the configured SMTP transport', async () => {
    const result = await sendTransactionalEmail('student@example.com', 'Zumbarl notification', '<p>Hello</p>')

    expect(nodemailer.createTransport).toHaveBeenCalledOnce()
    const transportOptions = vi.mocked(nodemailer.createTransport).mock.calls[0][0] as {
      host?: string
      port?: number
      secure?: boolean
    }
    expect(transportOptions.host).toBe(env.MAIL_HOST)
    expect(transportOptions.port).toBe(env.MAIL_PORT)
    expect(transportOptions.secure).toBe(env.MAIL_SECURE ?? env.MAIL_PORT === 465)
    expect(mailMocks.sendMail).toHaveBeenCalledWith({
      from: env.EMAIL_FROM,
      to: 'student@example.com',
      subject: 'Zumbarl notification',
      html: '<p>Hello</p>'
    })
    expect(result).toMatchObject({
      provider: 'smtp',
      status: 'sent',
      messageId: 'smtp-message-1'
    })
  })
})
