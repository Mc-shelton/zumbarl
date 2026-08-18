import Tesseract from 'tesseract.js'
import type { Prisma } from '@prisma/client'
import { ApiError } from '../../../lib/http.js'
import { prisma } from '../../../lib/prisma.js'
import { resolveLocalStoragePath } from '../../storage/index.js'
import { connectCommunityRepository } from '../../repositories/connect/index.js'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function jsonObject(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {}
}

function normalizeSocialHandle(value: unknown): string {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return ''
  const withoutUrl = raw
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/^(?:instagram\.com|tiktok\.com|youtube\.com|facebook\.com|x\.com|twitter\.com)\//, '')
  const handle = withoutUrl
    .split(/[/?#\s]/)[0]
    .replace(/^@/, '')
    .replace(/[^a-z0-9._-]/g, '')
  return handle ? `@${handle}` : ''
}

function extractSocialHandle(text: string, platform: string): string {
  const platformHosts: Record<string, string[]> = {
    instagram: ['instagram\\.com'],
    tiktok: ['tiktok\\.com'],
    youtube: ['youtube\\.com'],
    facebook: ['facebook\\.com'],
    x: ['x\\.com', 'twitter\\.com']
  }
  const hosts = platformHosts[platform.toLowerCase()] || Object.values(platformHosts).flat()
  for (const host of hosts) {
    const urlMatch = text.match(new RegExp(`${host}\\s*\\/\\s*@?([a-z0-9._-]{2,})`, 'i'))
    const handle = normalizeSocialHandle(urlMatch?.[1])
    if (handle) return handle
  }
  return normalizeSocialHandle(text.match(/@[a-z0-9._-]{2,}/i)?.[0])
}

function compareSocialHandles(expectedHandle: unknown, detectedHandle: unknown) {
  const expected = normalizeSocialHandle(expectedHandle)
  const detected = normalizeSocialHandle(detectedHandle)
  return {
    expectedHandle: expected || detected,
    detectedHandle: detected,
    matches: Boolean(detected && (!expected || detected === expected)),
    reason: !detected ? 'handle_not_detected' : expected && detected !== expected ? 'mismatch' : 'match'
  }
}

function requireStudentId(studentId?: string) {
  if (!studentId) throw new ApiError(403, 'A student profile is required', 'STUDENT_PROFILE_REQUIRED')
  return studentId
}

function parseCompactCount(value: string | undefined): number | null {
  if (!value) return null
  const normalized = value.toLowerCase().replace(/\s+/g, '').replace(/,/g, '')
  const match = normalized.match(/^([0-9]+(?:\.[0-9]+)?)([kmb])?$/)
  if (!match) return null
  const multipliers: Record<string, number> = { k: 1_000, m: 1_000_000, b: 1_000_000_000 }
  const number = Number(match[1]) * (match[2] ? multipliers[match[2]] : 1)
  return Number.isFinite(number) ? Math.round(number) : null
}

function extractMetric(text: string, labelPattern: string): number | null {
  const countPattern = '([0-9][0-9,.]*\\s*[kKmMbB]?)'
  const patterns = [
    new RegExp(`${countPattern}\\s*(?:${labelPattern})`, 'i'),
    new RegExp(`(?:${labelPattern})\\s*[:\\-]?\\s*${countPattern}`, 'i')
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    const value = parseCompactCount(match?.[1])
    if (value != null) return value
  }
  return null
}

function metricLabelsInOrder(text: string) {
  const labelPattern = /average\s+engagements?|avg\.?\s+engagements?|accounts\s+engaged|average\s+likes?|avg\.?\s+likes?|subscribers?|followers?|engagements?|interactions?|likes?/gi
  return [...text.matchAll(labelPattern)].map((match) => {
    const label = match[0].toLowerCase()
    if (label.includes('follow') || label.includes('subscriber')) return 'followers'
    if (label.includes('like')) return 'averageLikes'
    return 'averageEngagement'
  })
}

function metricsFromAdjacentRows(lines: string[]) {
  const metrics: Record<string, number | null> = {
    followers: null,
    averageLikes: null,
    averageEngagement: null
  }
  lines.forEach((line, index) => {
    const counts = [...line.matchAll(/\b[0-9][0-9,.]*\s*[kKmMbB]?\b/g)]
      .map((match) => parseCompactCount(match[0]))
      .filter((value): value is number => value != null)
    if (counts.length < 2) return
    const adjacentLabels = [lines[index - 1], lines[index + 1]]
      .filter(Boolean)
      .map(metricLabelsInOrder)
      .find((labels) => labels.length >= 2)
    if (!adjacentLabels) return
    adjacentLabels.forEach((metric, metricIndex) => {
      if (counts[metricIndex] != null) metrics[metric] = counts[metricIndex]
    })
  })
  return metrics
}

function extractSocialMetricsFromText(text: string, platform: string, ocrConfidence = 0) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/[|]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  const adjacentMetrics = metricsFromAdjacentRows(lines)
  const followers = lines.map((line) => extractMetric(line, 'followers?|subscribers?')).find((value) => value != null)
    ?? adjacentMetrics.followers
  const averageLikes = lines.map((line) => extractMetric(line, 'average\\s+likes?|avg\\.?\\s+likes?|likes?')).find((value) => value != null)
    ?? adjacentMetrics.averageLikes
  const averageEngagement = lines.map((line) => extractMetric(
    line,
    'average\\s+engagements?|avg\\.?\\s+engagements?|engagements?|accounts\\s+engaged|interactions?'
  )).find((value) => value != null) ?? adjacentMetrics.averageEngagement
  const handle = extractSocialHandle(text, platform)
  const detectedCount = [followers, averageLikes, averageEngagement].filter((value) => value != null).length
  const confidence = Math.round(Math.min(100, (detectedCount / 3) * 80 + Math.max(0, ocrConfidence) * 0.2))

  return {
    platform,
    handle,
    followers,
    averageLikes,
    averageEngagement,
    confidence,
    detectedCount
  }
}

async function requireOwnedScreenshot(uploadId: string, userId?: string) {
  if (!userId) throw new ApiError(401, 'Sign in to manage social metrics', 'UNAUTHENTICATED')
  const upload = await prisma.uploadedFile.findUnique({ where: { id: uploadId } })
  if (!upload || upload.ownerId !== userId) throw new ApiError(404, 'Screenshot was not found', 'SCREENSHOT_NOT_FOUND')
  if (!upload.mimeType.startsWith('image/')) throw new ApiError(400, 'Upload an image screenshot', 'SCREENSHOT_IMAGE_REQUIRED')
  if (upload.status !== 'complete') throw new ApiError(409, 'Screenshot upload is not complete', 'SCREENSHOT_NOT_READY')
  return upload
}

async function readSocialMarketingProfileService(studentId?: string) {
  const profile = await connectCommunityRepository.readProfile(requireStudentId(studentId))
  const accounts = Array.isArray(profile?.socialAccounts) ? profile.socialAccounts : []
  return {
    updateCadenceDays: 7,
    accounts: accounts.map((account: Record<string, any>) => {
      const lastUpdatedAt = account.lastUpdatedAt || profile?.updatedAt || null
      const nextUpdateDueAt = account.nextUpdateDueAt || (lastUpdatedAt
        ? new Date(new Date(lastUpdatedAt).getTime() + WEEK_MS).toISOString()
        : null)
      return {
        ...account,
        lastUpdatedAt,
        nextUpdateDueAt,
        isStale: Boolean(nextUpdateDueAt && new Date(nextUpdateDueAt).getTime() < Date.now())
      }
    })
  }
}

async function extractSocialMetricsService(userId: string | undefined, payload: Record<string, any>) {
  const upload = await requireOwnedScreenshot(payload.uploadId, userId)
  if (upload.provider !== 'local') throw new ApiError(422, 'This screenshot provider cannot be analysed yet', 'SCREENSHOT_PROVIDER_UNSUPPORTED')
  const imagePath = resolveLocalStoragePath(upload.bucket, upload.storageKey)
  const result = await Tesseract.recognize(imagePath, 'eng')
  const extraction = extractSocialMetricsFromText(result.data.text, payload.platform, result.data.confidence)
  const handleCheck = compareSocialHandles(payload.expectedHandle, extraction.handle)
  await prisma.uploadedFile.update({
    where: { id: upload.id },
    data: {
      metadata: {
        ...jsonObject(upload.metadata),
        socialMetricsVerification: {
          platform: payload.platform,
          extraction,
          handleCheck,
          extractedAt: new Date().toISOString()
        }
      } as Prisma.InputJsonValue
    }
  })
  return {
    extraction,
    handleCheck,
    screenshot: { id: upload.id, url: upload.url, fileName: upload.fileName }
  }
}

async function saveSocialMetricsService(studentId: string | undefined, userId: string | undefined, payload: Record<string, any>) {
  const ownerStudentId = requireStudentId(studentId)
  const upload = await requireOwnedScreenshot(payload.screenshotUploadId, userId)
  const currentProfile = await connectCommunityRepository.readProfile(ownerStudentId)
  const existingAccounts = Array.isArray(currentProfile?.socialAccounts) ? currentProfile.socialAccounts : []
  const existingAccount = existingAccounts.find((item: Record<string, any>) => (
    String(item.platform || '').toLowerCase() === String(payload.platform || '').toLowerCase()
  ))
  const verification = jsonObject(jsonObject(upload.metadata).socialMetricsVerification)
  const extraction = jsonObject(verification.extraction)
  if (String(verification.platform || '').toLowerCase() !== String(payload.platform || '').toLowerCase()) {
    throw new ApiError(409, 'This screenshot was analysed for a different social platform. Upload the correct screenshot.', 'SOCIAL_PLATFORM_MISMATCH')
  }
  const expectedHandle = existingAccount?.handle || payload.handle
  const handleCheck = compareSocialHandles(expectedHandle, extraction.handle)
  if (!handleCheck.detectedHandle) {
    throw new ApiError(422, 'We could not confirm the account handle in this screenshot. Upload a full profile or analytics screenshot that clearly shows your username.', 'SCREENSHOT_HANDLE_NOT_DETECTED')
  }
  if (!handleCheck.matches) {
    throw new ApiError(
      409,
      `This screenshot belongs to ${handleCheck.detectedHandle}, not ${handleCheck.expectedHandle}. Upload a screenshot from your own ${payload.platform} account.`,
      'SOCIAL_HANDLE_MISMATCH',
      handleCheck
    )
  }
  const now = new Date()
  const nextUpdateDueAt = new Date(now.getTime() + WEEK_MS)
  const account = {
    platform: payload.platform,
    handle: handleCheck.expectedHandle,
    followers: payload.followers,
    averageLikes: payload.averageLikes,
    averageEngagement: payload.averageEngagement,
    verified: true,
    verificationMethod: 'screenshot_ocr',
    verifiedAt: now.toISOString(),
    lastUpdatedAt: now.toISOString(),
    nextUpdateDueAt: nextUpdateDueAt.toISOString(),
    verificationExpiresAt: nextUpdateDueAt.toISOString(),
    screenshotUploadId: upload.id,
    screenshotUrl: upload.url,
    extractionConfidence: payload.extractionConfidence ?? null
  }
  const savedProfile = await connectCommunityRepository.upsertSocialAccount(ownerStudentId, account)
  const savedAccount = (savedProfile.socialAccounts || []).find((item: Record<string, any>) => item.platform === account.platform)
  return { account: savedAccount, updateCadenceDays: 7 }
}

export {
  compareSocialHandles,
  extractSocialMetricsFromText,
  normalizeSocialHandle,
  extractSocialMetricsService,
  readSocialMarketingProfileService,
  saveSocialMetricsService
}
