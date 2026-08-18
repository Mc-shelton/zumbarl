import { createHmac, randomUUID } from 'node:crypto'
import { env } from '../../config/env.js'

const CAMPAIGN_VISITOR_COOKIE = 'zmb_campaign_vid'
const VISITOR_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function readCampaignVisitorId(cookieHeader: string | undefined) {
  if (!cookieHeader) return null
  for (const cookie of cookieHeader.split(';')) {
    const separator = cookie.indexOf('=')
    if (separator < 0) continue
    const name = cookie.slice(0, separator).trim()
    if (name !== CAMPAIGN_VISITOR_COOKIE) continue
    const value = decodeURIComponent(cookie.slice(separator + 1).trim())
    return VISITOR_ID_PATTERN.test(value) ? value : null
  }
  return null
}

function createCampaignVisitorId() {
  return randomUUID()
}

function hashCampaignVisitorId(visitorId: string, trackingToken: string) {
  return createHmac('sha256', env.JWT_SECRET)
    .update(`campaign-visitor:${trackingToken}:${visitorId}`)
    .digest('hex')
}

function campaignVisitorCookie(visitorId: string, secure: boolean) {
  return [
    `${CAMPAIGN_VISITOR_COOKIE}=${encodeURIComponent(visitorId)}`,
    'Path=/api/v1/marketing/track',
    'Max-Age=31536000',
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : ''
  ].filter(Boolean).join('; ')
}

export {
  campaignVisitorCookie,
  createCampaignVisitorId,
  hashCampaignVisitorId,
  readCampaignVisitorId
}
