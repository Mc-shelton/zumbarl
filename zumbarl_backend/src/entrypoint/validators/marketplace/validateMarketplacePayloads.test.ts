import { describe, expect, it } from 'vitest'
import { cartItemSchema, listingSchema } from './validateMarketplacePayloads.js'

describe('marketplace service validation', () => {
  it('accepts an appointment-based campus service listing', () => {
    const result = listingSchema.safeParse({
      title: 'Campus barber',
      kind: 'service',
      serviceMode: 'appointment',
      duration: '30 minutes',
      availabilityText: 'Weekdays, 8:00 AM–6:00 PM',
      category: 'Beauty & care',
      priceAmount: 500,
      locationLabel: 'Student centre',
      latitude: -1.2864,
      longitude: 36.8172,
    })

    expect(result.success).toBe(true)
  })

  it('stores a timed order-ahead request in the cart contract', () => {
    const result = cartItemSchema.safeParse({
      listingId: 'campus-eatery-lunch',
      quantity: 1,
      serviceRequest: {
        mode: 'order_ahead',
        time: '12:30',
        notes: 'No chilli',
      },
    })

    expect(result.success).toBe(true)
  })

  it('rejects service requests without a fulfilment time', () => {
    expect(cartItemSchema.safeParse({
      listingId: 'campus-barber',
      serviceRequest: { mode: 'appointment' },
    }).success).toBe(false)
  })
})
