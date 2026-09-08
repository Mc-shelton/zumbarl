import { Buffer } from 'node:buffer'
import { createHmac, timingSafeEqual } from 'node:crypto'

function deliveryCode(orderId: string, buyerStudentId: string, secret: string) {
  const digest = createHmac('sha256', secret)
    .update(`marketplace-delivery:${orderId}:${buyerStudentId}`)
    .digest()
  return String(digest.readUInt32BE(0) % 1_000_000).padStart(6, '0')
}

function verifyDeliveryCode(candidate: string, orderId: string, buyerStudentId: string, secret: string) {
  const normalized = String(candidate || '').trim()
  if (!/^\d{6}$/.test(normalized)) return false
  const expected = deliveryCode(orderId, buyerStudentId, secret)
  return timingSafeEqual(Buffer.from(normalized), Buffer.from(expected))
}

export { deliveryCode, verifyDeliveryCode }
