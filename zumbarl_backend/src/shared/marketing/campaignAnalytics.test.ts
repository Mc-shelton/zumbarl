import { describe, expect, it } from 'vitest'
import { extractCampaignAnalyticsFromText, parseCompactMetric } from './campaignAnalytics.js'

describe('campaign analytics extraction', () => {
  it('parses compact social metrics', () => {
    expect(parseCompactMetric('12.5K')).toBe(12500)
    expect(parseCompactMetric('1,240')).toBe(1240)
  })

  it('extracts private analytics and derives engagement', () => {
    const result = extractCampaignAnalyticsFromText(
      'Accounts reached 12.5K Impressions 18,200 Likes 840 Comments 35 Shares 21 Saves 14 Link clicks 63',
      90
    )
    expect(result.metrics).toMatchObject({
      reach: 12500,
      impressions: 18200,
      likes: 840,
      comments: 35,
      shares: 21,
      saves: 14,
      clicks: 63,
      engagement: 910
    })
    expect(result.confidence).toBeGreaterThan(80)
  })
})
