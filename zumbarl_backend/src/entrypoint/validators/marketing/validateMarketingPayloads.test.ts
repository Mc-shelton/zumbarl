import { describe, expect, it } from 'vitest'
import { createMarketingCampaignSchema, submitCampaignProofSchema } from './validateMarketingPayloads.js'

const validCampaign = {
  title: 'Campus launch campaign',
  budgetAmount: 1000,
  platforms: ['Instagram'],
  payoutPerCampaigner: 100,
  materials: [{ title: 'Creative', type: 'image', url: 'https://example.com/ad.png' }]
}

describe('Zumbarl Ads campaign validation', () => {
  it('accepts a complete optional ad review request', () => {
    expect(createMarketingCampaignSchema.safeParse({
      ...validCampaign,
      zumbarlAds: {
        requested: true,
        headline: 'Meet students where they are',
        description: 'Discover the new campus launch.',
        destinationUrl: 'https://example.com/launch'
      }
    }).success).toBe(true)
  })

  it('requires ad copy only when promotion is requested', () => {
    expect(createMarketingCampaignSchema.safeParse({
      ...validCampaign,
      zumbarlAds: { requested: true }
    }).success).toBe(false)
    expect(createMarketingCampaignSchema.safeParse({
      ...validCampaign,
      zumbarlAds: { requested: false }
    }).success).toBe(true)
  })
})

describe('campaign proof validation', () => {
  it('accepts one post and analytics screenshot per campaign platform', () => {
    const result = submitCampaignProofSchema.safeParse({
      posts: [
        { platform: 'Instagram', postUrl: 'https://instagram.com/p/example' },
        { platform: 'TikTok', postUrl: 'https://tiktok.com/@creator/video/123' },
        { platform: 'YouTube', postUrl: 'https://youtube.com/watch?v=example' }
      ],
      analyticsScreenshots: [
        { platform: 'Instagram', uploadId: 'instagram-upload' },
        { platform: 'TikTok', uploadId: 'tiktok-upload' },
        { platform: 'YouTube', uploadId: 'youtube-upload' }
      ]
    })
    expect(result.success).toBe(true)
  })

  it('keeps accepting the legacy single-platform payload', () => {
    expect(submitCampaignProofSchema.safeParse({
      platform: 'Instagram',
      postUrl: 'https://instagram.com/p/example',
      analyticsScreenshots: [{ platform: 'Instagram', uploadId: 'instagram-upload' }]
    }).success).toBe(true)
  })

  it('rejects duplicate platform posts', () => {
    expect(submitCampaignProofSchema.safeParse({
      posts: [
        { platform: 'Instagram', postUrl: 'https://instagram.com/p/one' },
        { platform: 'instagram', postUrl: 'https://instagram.com/p/two' }
      ],
      analyticsScreenshots: [{ platform: 'Instagram', uploadId: 'instagram-upload' }]
    }).success).toBe(false)
  })
})
