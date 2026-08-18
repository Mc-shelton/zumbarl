import Tesseract from 'tesseract.js'
import { ApiError } from '../../../lib/http.js'
import { prisma } from '../../../lib/prisma.js'
import { extractCampaignAnalyticsFromText } from '../../../shared/marketing/campaignAnalytics.js'
import { resolveLocalStoragePath } from '../../storage/index.js'
import { compareSocialHandles, extractSocialMetricsFromText } from '../connect/manageSocialMetricsService.js'

function objectValue(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {}
}

function supportedPlatformHost(platform: string, hostname: string) {
  const hosts: Record<string, string[]> = {
    instagram: ['instagram.com'],
    tiktok: ['tiktok.com'],
    youtube: ['youtube.com', 'youtu.be'],
    facebook: ['facebook.com', 'fb.watch'],
    x: ['x.com', 'twitter.com'],
    linkedin: ['linkedin.com']
  }
  return (hosts[platform.toLowerCase()] || []).some((host) => hostname === host || hostname.endsWith(`.${host}`))
}

function verifyCampaignPostUrl(postUrl: string, platform: string, allowedPlatforms: string[]) {
  const url = new URL(postUrl)
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new ApiError(422, 'The campaign post must use an HTTP or HTTPS link.', 'CAMPAIGN_POST_URL_INVALID')
  }
  if (!allowedPlatforms.some((item) => item.toLowerCase() === platform.toLowerCase())) {
    throw new ApiError(422, `${platform} is not enabled for this campaign.`, 'CAMPAIGN_PLATFORM_INVALID')
  }
  if (!supportedPlatformHost(platform, url.hostname.toLowerCase())) {
    throw new ApiError(422, `The submitted link is not a valid ${platform} post.`, 'CAMPAIGN_POST_PLATFORM_MISMATCH')
  }
  return {
    url: url.toString(),
    platform,
    hostname: url.hostname.toLowerCase(),
    status: 'link_confirmed'
  }
}

async function verifyAnalyticsScreenshot(
  screenshot: Record<string, any>,
  userId: string,
  expectedHandle: string | undefined
) {
  const upload = await prisma.uploadedFile.findUnique({ where: { id: screenshot.uploadId } })
  if (!upload || upload.ownerId !== userId) {
    throw new ApiError(404, 'Analytics screenshot was not found.', 'CAMPAIGN_ANALYTICS_SCREENSHOT_NOT_FOUND')
  }
  if (!upload.mimeType.startsWith('image/') || upload.status !== 'complete' || upload.provider !== 'local') {
    throw new ApiError(422, 'Upload a completed image screenshot for campaign analytics.', 'CAMPAIGN_ANALYTICS_SCREENSHOT_INVALID')
  }

  const imagePath = resolveLocalStoragePath(upload.bucket, upload.storageKey)
  const ocr = await Tesseract.recognize(imagePath, 'eng')
  const analytics = extractCampaignAnalyticsFromText(ocr.data.text, ocr.data.confidence)
  const social = extractSocialMetricsFromText(ocr.data.text, screenshot.platform, ocr.data.confidence)
  const handleCheck = compareSocialHandles(expectedHandle, social.handle)
  const reasons = [
    ...(!handleCheck.detectedHandle ? ['handle_not_detected'] : []),
    ...(handleCheck.detectedHandle && !handleCheck.matches ? ['handle_mismatch'] : []),
    ...(analytics.detectedCount < 2 ? ['insufficient_metrics'] : [])
  ]
  return {
    uploadId: upload.id,
    url: upload.url,
    fileName: upload.fileName,
    platform: screenshot.platform,
    metrics: analytics.metrics,
    confidence: analytics.confidence,
    ocrConfidence: Math.round(ocr.data.confidence),
    handleCheck,
    status: reasons.length ? 'needs_review' : 'verified_screenshot',
    reasons
  }
}

function aggregateVerifiedEvidence(evidence: Record<string, any>[]) {
  const verified = evidence.filter((item) => item.status === 'verified_screenshot')
  const perPlatform = new Map<string, Record<string, number>>()
  for (const item of verified) {
    const current = perPlatform.get(item.platform) || {}
    for (const [metric, value] of Object.entries(objectValue(item.metrics))) {
      if (typeof value === 'number') current[metric] = Math.max(current[metric] || 0, value)
    }
    perPlatform.set(item.platform, current)
  }
  const totals: Record<string, number> = {}
  for (const metrics of perPlatform.values()) {
    for (const [metric, value] of Object.entries(metrics)) totals[metric] = (totals[metric] || 0) + value
  }
  return totals
}

async function verifyCampaignProof(
  campaign: Record<string, any>,
  actor: { id: string; studentId?: string },
  payload: Record<string, any>
) {
  const requestedPosts = Array.isArray(payload.posts) && payload.posts.length
    ? payload.posts
    : [{ postUrl: payload.postUrl, platform: payload.platform }]
  const posts = requestedPosts.map((item: Record<string, any>) => (
    verifyCampaignPostUrl(item.postUrl, item.platform, campaign.platforms || [])
  ))
  const postPlatforms = new Set<string>(posts.map((post) => post.platform.toLowerCase()))
  const screenshotPlatforms = new Set<string>(
    payload.analyticsScreenshots.map((screenshot: Record<string, any>) => String(screenshot.platform).toLowerCase())
  )
  const missingScreenshots = [...postPlatforms].filter((platform) => !screenshotPlatforms.has(platform))
  const unexpectedScreenshots = [...screenshotPlatforms].filter((platform) => !postPlatforms.has(platform))
  if (missingScreenshots.length) {
    throw new ApiError(
      422,
      `Upload an analytics screenshot for: ${missingScreenshots.join(', ')}.`,
      'CAMPAIGN_ANALYTICS_SCREENSHOT_MISSING'
    )
  }
  if (unexpectedScreenshots.length) {
    throw new ApiError(
      422,
      `Each analytics screenshot must match a submitted post: ${unexpectedScreenshots.join(', ')}.`,
      'CAMPAIGN_ANALYTICS_SCREENSHOT_PLATFORM_MISMATCH'
    )
  }
  const profile = actor.studentId
    ? await prisma.connectProfile.findUnique({ where: { studentId: actor.studentId } })
    : null
  const profilePayload = objectValue(profile?.payload)
  const accounts = Array.isArray(profilePayload.socialAccounts) ? profilePayload.socialAccounts : []
  const evidence = await Promise.all(payload.analyticsScreenshots.map((screenshot: Record<string, any>) => {
    const account = accounts.find((item: Record<string, any>) => (
      String(item.platform || '').toLowerCase() === String(screenshot.platform).toLowerCase() && item.verified === true
    ))
    return verifyAnalyticsScreenshot(screenshot, actor.id, account?.handle)
  }))
  const metrics = aggregateVerifiedEvidence(evidence)
  const status = evidence.every((item) => item.status === 'verified_screenshot')
    ? 'verified_screenshot'
    : 'needs_review'
  return {
    ...payload,
    posts: posts.map((post) => ({ postUrl: post.url, platform: post.platform })),
    postUrl: posts[0].url,
    platform: posts[0].platform,
    links: posts.map((post) => post.url),
    screenshots: evidence.map((item) => item.url),
    videos: [],
    platformUploads: posts.map((post) => ({ platform: post.platform, url: post.url, status: post.status })),
    reach: metrics.reach ?? metrics.impressions ?? metrics.views ?? null,
    engagement: metrics.engagement ?? null,
    status,
    verification: { status, post: posts[0], posts, analyticsEvidence: evidence, metrics }
  }
}

export {
  aggregateVerifiedEvidence,
  verifyCampaignPostUrl,
  verifyCampaignProof
}
