import { describe, expect, it } from 'vitest'
import { getOrderTotals, getSellerCommission } from './pricing'

describe('marketplace pricing', () => {
  it('calculates quantities and charges one quoted delivery fee per fulfilment route', () => {
    const totals = getOrderTotals([
      {
        id: 'item-1', shopId: 'shop-1', price: 500, qty: 2,
        fulfilment: { method: 'delivery', location: 'Campus gate', quoted: true, fee: 150 },
      },
      {
        id: 'item-2', shopId: 'shop-1', price: 250, qty: 1,
        fulfilment: { method: 'delivery', location: 'Campus gate', quoted: true, fee: 150 },
      },
    ])

    expect(totals).toMatchObject({ itemCount: 3, subtotal: 1250, deliveryFee: 150, finalTotal: 1400 })
  })

  it('does not charge delivery for pickup or digital items', () => {
    const totals = getOrderTotals([
      { id: 'pickup', unitPrice: 300, quantity: 1, fulfilment: { method: 'pickup', quoted: true, fee: 100 } },
      { id: 'digital', price: 200, qty: 1, fulfilment: { method: 'digital', quoted: true, fee: 100 } },
    ])

    expect(totals).toMatchObject({ subtotal: 500, deliveryFee: 0, hasDelivery: false, finalTotal: 500 })
  })

  it('keeps checkout pending while any delivery quote is unresolved', () => {
    const totals = getOrderTotals([
      { id: 'item-1', price: 500, qty: 1, fulfilment: { method: 'delivery', quoted: false } },
    ])

    expect(totals.deliveryPending).toBe(true)
  })

  it('rounds the seller commission to the nearest shilling', () => {
    expect(getSellerCommission(1010)).toBe(76)
  })
})
