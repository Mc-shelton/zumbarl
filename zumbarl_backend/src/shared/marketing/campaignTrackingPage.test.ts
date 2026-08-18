import { describe, expect, it } from 'vitest'
import { renderCampaignTrackingPage } from './campaignTrackingPage.js'

describe('campaign tracking preview page', () => {
  it('renders cached destination OG tags and an external redirect script', () => {
    const html = renderCampaignTrackingPage({
      trackingToken: 'tracking-token-123',
      trackingDestinationUrl: 'https://example.com/offer',
      campaign: {
        title: 'Fallback Campaign',
        linkPreview: {
          title: 'Student Bundle',
          description: 'Affordable student data',
          imageUrl: 'https://example.com/preview.jpg',
          siteName: 'Example Mobile'
        }
      }
    }, 'https://zumbarl.example')
    expect(html).toContain('<meta property="og:title" content="Student Bundle">')
    expect(html).toContain('<meta property="og:image" content="https://example.com/preview.jpg">')
    expect(html).toContain('src="/api/v1/marketing/track-client.js"')
    expect(html).toContain('class="card"')
    expect(html).toContain('Verified campaign link')
    expect(html).toContain('Opening destination')
    expect(html).toContain('example.com')
    expect(html).toContain('Continue now')
    expect(html).not.toContain('fetch(')
  })
})
