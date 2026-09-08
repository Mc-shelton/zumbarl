import { describe, expect, it } from 'vitest'
import { createPageConversationSchema, createPageMessageSchema, messageContextSchema, pageConversationQuerySchema } from './validateMessagePayloads.js'

describe('message context validation', () => {
  it('accepts a role-aware marketplace order reference', () => {
    const result = messageContextSchema.safeParse({
      type: 'marketplace_order',
      order: {
        id: 'order-123',
        identifier: '#ORDER123',
        title: 'Beef Chapo',
        status: 'in_transit',
        senderUserId: 'buyer-user',
        recipientUserId: 'errander-user',
        senderHref: '/campus/opportunities/buy-sell?view=orders&orderId=order-123',
        recipientHref: '/campus/profile?tab=errands&orderId=order-123',
      },
    })

    expect(result.success).toBe(true)
  })

  it('rejects an order reference without role-specific destinations', () => {
    expect(messageContextSchema.safeParse({
      type: 'marketplace_order',
      order: { id: 'order-123', identifier: '#ORDER123', title: 'Beef Chapo', status: 'in_transit' },
    }).success).toBe(false)
  })
})

describe('page conversation validation', () => {
  it('accepts supported page identities and an optional customer', () => {
    expect(createPageConversationSchema.parse({
      pageType: 'marketplace_shop',
      pageId: 'shop-123',
      customerUserId: 'customer-123'
    })).toEqual({
      pageType: 'marketplace_shop',
      pageId: 'shop-123',
      customerUserId: 'customer-123'
    })

    expect(pageConversationQuerySchema.safeParse({
      pageType: 'managed_profile',
      pageId: 'profile-123'
    }).success).toBe(true)
  })

  it('rejects unsupported page types', () => {
    expect(createPageConversationSchema.safeParse({
      pageType: 'student_profile',
      pageId: 'profile-123'
    }).success).toBe(false)
  })

  it('defaults customer messages to the user identity', () => {
    expect(createPageMessageSchema.parse({ body: 'Hello page' })).toEqual({
      body: 'Hello page',
      fileUrls: [],
      sendAsPage: false
    })
  })
})
