import { describe, expect, it } from 'vitest'
import { campusVendorListingSchema, cartItemSchema, listingSchema, vendorPostSchema } from './validateMarketplacePayloads.js'

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

  it('accepts the normal Explore Campus post format for a vendor profile', () => {
    const result = vendorPostSchema.safeParse({
      type: 'image',
      body: 'Today’s lunch menu is ready.',
      visibility: 'campus',
      tags: [{ type: 'university', id: 'campus-1', label: 'Multimedia University' }],
      mediaUrls: ['https://cdn.example.com/menu.jpg'],
      mediaEdits: [{ type: 'image', zoom: 1.2, positionX: 50, positionY: 45 }],
    })

    expect(result.success).toBe(true)
  })

  it('accepts campus-only food inventory without delivery coordinates', () => {
    const result = campusVendorListingSchema.safeParse({
      title: 'Beef stew and chapati',
      kind: 'service',
      serviceMode: 'order_ahead',
      description: 'Fresh beef stew served with two chapatis.',
      category: 'Meals',
      priceAmount: 250,
      stock: 20,
      locationLabel: 'MMU main campus',
      inventoryType: 'food',
      foodType: 'meal',
      preparationMinutes: 15,
      campusOnly: true,
    })

    expect(result.success).toBe(true)
  })
})
