import { describe, expect, it } from 'vitest'
import {
  campaignVisitorCookie,
  createCampaignVisitorId,
  hashCampaignVisitorId,
  readCampaignVisitorId
} from './campaignVisitor.js'

describe('campaign visitor identity', () => {
  it('round-trips a valid anonymous visitor cookie', () => {
    const visitorId = createCampaignVisitorId()
    const cookie = campaignVisitorCookie(visitorId, true)
    expect(readCampaignVisitorId(`another=value; ${cookie}`)).toBe(visitorId)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Secure')
  })

  it('rejects forged IDs and produces a stable non-reversible hash', () => {
    expect(readCampaignVisitorId('zmb_campaign_vid=not-a-uuid')).toBeNull()
    const visitorId = createCampaignVisitorId()
    expect(hashCampaignVisitorId(visitorId, 'token-one')).toBe(hashCampaignVisitorId(visitorId, 'token-one'))
    expect(hashCampaignVisitorId(visitorId, 'token-one')).not.toBe(hashCampaignVisitorId(visitorId, 'token-two'))
    expect(hashCampaignVisitorId(visitorId, 'token-one')).not.toContain(visitorId)
  })
})
