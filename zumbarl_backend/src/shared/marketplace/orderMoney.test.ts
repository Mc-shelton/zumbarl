import { describe, expect, it } from 'vitest'
import { calculateOrderMoney } from './orderMoney.js'

describe('marketplace order money allocation', () => {
  it('deduplicates one errand charge per shop and conserves the order total', () => {
    const allocation = calculateOrderMoney([
      { sellerId: 'seller-a', shopId: 'shop-a', unitAmount: 75, quantity: 2, fulfilment: { method: 'errand_delivery', fee: 100, location: 'Hostel B', quoted: true } },
      { sellerId: 'seller-a', shopId: 'shop-a', unitAmount: 50, quantity: 2, fulfilment: { method: 'errand_delivery', fee: 100, location: 'Hostel B', quoted: true } }
    ])

    expect(allocation).toMatchObject({ itemSubtotal: 250, deliveryTotal: 100, totalAmount: 350 })
    expect(allocation.sellers).toEqual([{ id: 'seller-a', amount: 250 }])
    expect(allocation.errands).toEqual([{ id: 'shop-a', amount: 100 }])
  })

  it('allocates seller and platform delivery fees to their correct recipients', () => {
    const allocation = calculateOrderMoney([
      { sellerId: 'seller-a', shopId: 'shop-a', unitAmount: 120.5, quantity: 1, fulfilment: { method: 'seller_delivery', fee: 30.25, location: 'Gate A', quoted: true } },
      { sellerId: 'seller-b', shopId: 'shop-b', unitAmount: 80, quantity: 1, fulfilment: { method: 'zumbarl_delivery', fee: 45.5, location: 'Gate A', quoted: true } }
    ])

    expect(allocation.sellers).toEqual([
      { id: 'seller-a', amount: 150.75 },
      { id: 'seller-b', amount: 80 }
    ])
    expect(allocation.platformDeliveryAmount).toBe(45.5)
    expect(allocation.totalAmount).toBe(276.25)
  })

  it('rejects inconsistent shared delivery details', () => {
    expect(() => calculateOrderMoney([
      { sellerId: 'seller-a', shopId: 'shop-a', unitAmount: 50, quantity: 1, fulfilment: { method: 'errand_delivery', fee: 100, location: 'Hostel A', quoted: true } },
      { sellerId: 'seller-a', shopId: 'shop-a', unitAmount: 50, quantity: 1, fulfilment: { method: 'errand_delivery', fee: 100, location: 'Hostel B', quoted: true } }
    ])).toThrow('multiple delivery destinations')
  })

  it('rejects invalid quantities and negative money', () => {
    expect(() => calculateOrderMoney([{ sellerId: 'seller-a', unitAmount: 50, quantity: 0 }])).toThrow('positive integer')
    expect(() => calculateOrderMoney([{ sellerId: 'seller-a', unitAmount: -1, quantity: 1 }])).toThrow('cannot be negative')
  })
})
