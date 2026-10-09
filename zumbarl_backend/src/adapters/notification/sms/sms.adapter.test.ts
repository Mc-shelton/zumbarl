import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '../../../config/env.js'
import { sendSmsMessage } from './sms.adapter.js'

const originalProvider = env.SMS_PROVIDER

beforeEach(() => {
  env.SMS_PROVIDER = 'africas_talking'
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  env.SMS_PROVIDER = originalProvider
  vi.unstubAllGlobals()
})

describe(`Africa's Talking SMS adapter`, () => {
  it('submits a real provider request and reports acceptance without claiming delivery', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(new Response(JSON.stringify({
      SMSMessageData: {
        Message: 'Sent to 1/1 Total Cost: KES 0.8000',
        Recipients: [{ cost: 'KES 0.8000', messageId: 'ATXid_1', number: '+254700000001', status: 'Success', statusCode: 101 }]
      }
    }), { status: 201, headers: { 'Content-Type': 'application/json' } }))

    const result = await sendSmsMessage('+254700000001', 'Your interview starts at 10:00.')

    expect(globalThis.fetch).toHaveBeenCalledOnce()
    const [url, options] = vi.mocked(globalThis.fetch).mock.calls[0]
    expect(url).toBe('https://api.sandbox.africastalking.com/version1/messaging')
    expect(options?.method).toBe('POST')
    expect(options?.headers).toMatchObject({ apiKey: env.SMS_API_KEY })
    expect(String(options?.body)).toContain('to=%2B254700000001')
    expect(result).toMatchObject({
      provider: 'africas_talking',
      status: 'accepted',
      providerStatus: 'Success',
      messageId: 'ATXid_1'
    })
  })

  it('does not call the provider for an invalid recipient', async () => {
    await expect(sendSmsMessage('0700000001', 'Hello')).resolves.toMatchObject({ status: 'failed', retryable: false })
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('marks provider throttling as failed and retryable without claiming it was queued', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(new Response(JSON.stringify({
      SMSMessageData: { Message: 'Too many requests' }
    }), { status: 429, headers: { 'Content-Type': 'application/json' } }))

    await expect(sendSmsMessage('+254700000001', 'Hello')).resolves.toMatchObject({
      status: 'failed',
      retryable: true,
      error: 'Too many requests'
    })
  })
})
