import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '../../../config/env.js'
import { sendWhatsappTemplate } from './whatsapp.adapter.js'

const original = {
  accountSid: env.WHATSAPP_ACCOUNT_SID,
  provider: env.WHATSAPP_PROVIDER
}
const contentSid = 'HX00000000000000000000000000000000'

beforeEach(() => {
  env.WHATSAPP_PROVIDER = 'twilio'
  env.WHATSAPP_ACCOUNT_SID = 'AC00000000000000000000000000000000'
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  env.WHATSAPP_PROVIDER = original.provider
  env.WHATSAPP_ACCOUNT_SID = original.accountSid
  vi.unstubAllGlobals()
})

describe('Twilio WhatsApp adapter', () => {
  it('submits an approved content template and reports provider acceptance', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(new Response(JSON.stringify({
      sid: 'SM00000000000000000000000000000000',
      status: 'queued',
      error_code: null,
      error_message: null
    }), { status: 201, headers: { 'Content-Type': 'application/json' } }))

    const result = await sendWhatsappTemplate('+254700000001', contentSid, { '1': 'Aisha', '2': '10:00' })

    expect(globalThis.fetch).toHaveBeenCalledOnce()
    const [url, options] = vi.mocked(globalThis.fetch).mock.calls[0]
    expect(url).toBe(`https://api.twilio.com/2010-04-01/Accounts/${env.WHATSAPP_ACCOUNT_SID}/Messages.json`)
    expect(options?.method).toBe('POST')
    expect(options?.headers).toMatchObject({
      Authorization: expect.stringMatching(/^Basic /)
    })
    expect(String(options?.body)).toContain(`ContentSid=${contentSid}`)
    expect(result).toMatchObject({
      provider: 'twilio',
      status: 'accepted',
      providerStatus: 'queued',
      messageId: 'SM00000000000000000000000000000000'
    })
  })

  it('rejects a friendly template name because Twilio requires an approved Content SID', async () => {
    await expect(sendWhatsappTemplate('+254700000001', 'interview_reminder', {})).resolves.toMatchObject({
      status: 'failed',
      error: 'Twilio WhatsApp template must be a Content SID'
    })
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('surfaces provider failures without claiming the message was sent', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(new Response(JSON.stringify({
      code: 63016,
      message: 'Failed to send freeform message because you are outside the allowed window.',
      status: 400
    }), { status: 400, headers: { 'Content-Type': 'application/json' } }))

    await expect(sendWhatsappTemplate('+254700000001', contentSid, {})).resolves.toMatchObject({
      status: 'failed',
      retryable: false
    })
  })
})
