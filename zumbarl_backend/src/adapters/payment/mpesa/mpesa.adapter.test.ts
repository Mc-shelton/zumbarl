import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearMpesaTokenCache,
  normalizeKenyanPhoneNumber,
  requestMpesaStkPush
} from './mpesa.adapter.js'

function jsonResponse(body: Record<string, any>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  clearMpesaTokenCache()
})

describe('M-Pesa provider adapter', () => {
  it('normalizes supported Kenyan phone formats', () => {
    expect(normalizeKenyanPhoneNumber('0712 345 678')).toBe('254712345678')
    expect(normalizeKenyanPhoneNumber('+254 712 345 678')).toBe('254712345678')
    expect(() => normalizeKenyanPhoneNumber('555')).toThrow(/valid Kenyan Safaricom number/i)
  })

  it('authorizes and sends a real STK-shaped provider request without exposing credentials', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'test-access-token', expires_in: '3599' }))
      .mockResolvedValueOnce(jsonResponse({
        MerchantRequestID: 'merchant-1',
        CheckoutRequestID: 'checkout-1',
        ResponseCode: '0',
        ResponseDescription: 'Success. Request accepted for processing',
        CustomerMessage: 'Success. Request accepted for processing'
      }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await requestMpesaStkPush({
      amount: 1250,
      phoneNumber: '0712345678',
      accountReference: 'ZMBTEST123',
      transactionDescription: 'Escrow funding',
      callbackUrl: 'https://api.example.test/api/v1/finance/mpesa/callback'
    })

    expect(result).toMatchObject({ merchantRequestId: 'merchant-1', checkoutRequestId: 'checkout-1' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const stkCall = fetchMock.mock.calls[1]
    const body = JSON.parse(String(stkCall[1].body))
    expect(body).toMatchObject({
      Amount: 1250,
      PartyA: '254712345678',
      PhoneNumber: '254712345678',
      AccountReference: 'ZMBTEST123'
    })
    expect(stkCall[1].headers.Authorization).toBe('Bearer test-access-token')
    expect(body.Password).toBeTruthy()
  })

  it('turns provider rejection into an actionable error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      errorCode: '400.002.02',
      errorMessage: 'Invalid Request Payload'
    }, 400)))
    await expect(requestMpesaStkPush({
      amount: 1250,
      phoneNumber: '0712345678',
      accountReference: 'ZMBTEST123',
      transactionDescription: 'Escrow funding',
      callbackUrl: 'https://api.example.test/callback'
    })).rejects.toMatchObject({
      message: 'Invalid Request Payload',
      details: { providerStatus: 400, providerCode: '400.002.02' }
    })
  })

  it('marks a network failure after submission as an unknown outcome', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'test-access-token', expires_in: '3599' }))
      .mockRejectedValueOnce(new TypeError('network disconnected'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(requestMpesaStkPush({
      amount: 1250,
      phoneNumber: '0712345678',
      accountReference: 'ZMBTEST123',
      transactionDescription: 'Escrow funding',
      callbackUrl: 'https://api.example.test/callback'
    })).rejects.toMatchObject({
      details: { code: 'MPESA_UNREACHABLE', outcomeUnknown: true }
    })
  })
})
