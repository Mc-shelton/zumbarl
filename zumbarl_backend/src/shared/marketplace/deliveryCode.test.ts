import { describe, expect, it } from 'vitest'
import { deliveryCode, verifyDeliveryCode } from './deliveryCode.js'

describe('marketplace delivery codes', () => {
  const secret = 'a-secret-long-enough-for-a-delivery-code-test'

  it('creates a stable six-digit code bound to the order and buyer', () => {
    const code = deliveryCode('order-1', 'buyer-1', secret)
    expect(code).toMatch(/^\d{6}$/)
    expect(deliveryCode('order-1', 'buyer-1', secret)).toBe(code)
    expect(deliveryCode('order-2', 'buyer-1', secret)).not.toBe(code)
  })

  it('accepts only the exact code for the intended order and buyer', () => {
    const code = deliveryCode('order-1', 'buyer-1', secret)
    expect(verifyDeliveryCode(code, 'order-1', 'buyer-1', secret)).toBe(true)
    expect(verifyDeliveryCode(code, 'order-1', 'buyer-2', secret)).toBe(false)
    expect(verifyDeliveryCode('12345', 'order-1', 'buyer-1', secret)).toBe(false)
  })
})
