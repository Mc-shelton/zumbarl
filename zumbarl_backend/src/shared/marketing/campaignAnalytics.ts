type CampaignAnalyticsMetrics = {
  reach: number | null
  impressions: number | null
  views: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  clicks: number | null
  engagement: number | null
}

function parseCompactMetric(value: string | undefined) {
  if (!value) return null
  const normalized = value.toLowerCase().replace(/[\s,]/g, '')
  const match = normalized.match(/^([0-9]+(?:\.[0-9]+)?)([kmb])?$/)
  if (!match) return null
  const multiplier = match[2] === 'k' ? 1_000 : match[2] === 'm' ? 1_000_000 : match[2] === 'b' ? 1_000_000_000 : 1
  const parsed = Number(match[1]) * multiplier
  return Number.isFinite(parsed) ? Math.round(parsed) : null
}

function extractLabeledMetric(text: string, labels: string) {
  const count = '([0-9][0-9,.]*\\s*[kKmMbB]?)'
  const patterns = [
    new RegExp(`(?:${labels})\\s*[:\\-]?\\s*${count}`, 'i'),
    new RegExp(`${count}\\s*(?:${labels})`, 'i')
  ]
  for (const pattern of patterns) {
    const value = parseCompactMetric(text.match(pattern)?.[1])
    if (value != null) return value
  }
  return null
}

function extractCampaignAnalyticsFromText(text: string, ocrConfidence = 0) {
  const normalized = text.replace(/[|]/g, ' ').replace(/\s+/g, ' ')
  const metrics: CampaignAnalyticsMetrics = {
    reach: extractLabeledMetric(normalized, 'reach|accounts\\s+reached'),
    impressions: extractLabeledMetric(normalized, 'impressions?'),
    views: extractLabeledMetric(normalized, 'views?|plays?'),
    likes: extractLabeledMetric(normalized, 'likes?'),
    comments: extractLabeledMetric(normalized, 'comments?'),
    shares: extractLabeledMetric(normalized, 'shares?'),
    saves: extractLabeledMetric(normalized, 'saves?|bookmarks?'),
    clicks: extractLabeledMetric(normalized, 'link\\s+clicks?|website\\s+clicks?|clicks?'),
    engagement: extractLabeledMetric(normalized, 'engagements?|interactions?|accounts\\s+engaged')
  }
  if (metrics.engagement == null) {
    const components = [metrics.likes, metrics.comments, metrics.shares, metrics.saves]
    if (components.some((value) => value != null)) {
      metrics.engagement = components.reduce<number>((sum, value) => sum + Number(value || 0), 0)
    }
  }
  const detectedCount = Object.values(metrics).filter((value) => value != null).length
  const confidence = Math.round(Math.min(100, (detectedCount / 5) * 75 + Math.max(0, ocrConfidence) * 0.25))
  return { metrics, detectedCount, confidence }
}

export {
  extractCampaignAnalyticsFromText,
  parseCompactMetric,
  type CampaignAnalyticsMetrics
}
