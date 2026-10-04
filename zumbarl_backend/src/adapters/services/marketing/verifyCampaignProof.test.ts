import { describe, expect, it } from 'vitest'
import { verifyCampaignPostUrl } from './verifyCampaignProof.js'

describe('campaign post URL verification', () => {
  it('accepts a matching platform post URL', () => {
    expect(verifyCampaignPostUrl(
      'https://www.instagram.com/p/abc123/',
      'Instagram',
      ['Instagram', 'TikTok']
    )).toMatchObject({ platform: 'Instagram', hostname: 'www.instagram.com', status: 'link_confirmed' })
  })

  it('rejects a link from another platform', () => {
    expect(() => verifyCampaignPostUrl(
      'https://www.youtube.com/watch?v=abc123',
      'Instagram',
      ['Instagram', 'TikTok']
    )).toThrow(expect.objectContaining({ code: 'CAMPAIGN_POST_PLATFORM_MISMATCH', statusCode: 422 }))
  })

  it('rejects a platform that is not part of the campaign', () => {
    expect(() => verifyCampaignPostUrl(
      'https://www.tiktok.com/@creator/video/123',
      'TikTok',
      ['Instagram']
    )).toThrow(expect.objectContaining({ code: 'CAMPAIGN_PLATFORM_INVALID', statusCode: 422 }))
  })
})
