import { promises as dns } from 'node:dns'
import { isIP } from 'node:net'
import { TextDecoder } from 'node:util'
import { env } from '../../../config/env.js'
import { extractLinkPreview } from '../../../shared/marketing/linkPreview.js'

const MAX_PREVIEW_BYTES = 512 * 1024

function isPublicIpAddress(address: string) {
  const normalized = address.toLowerCase().replace(/^::ffff:/, '')
  if (isIP(normalized) === 4) {
    const [first, second] = normalized.split('.').map(Number)
    return !(
      first === 0 || first === 10 || first === 127 || first >= 224
      || (first === 100 && second >= 64 && second <= 127)
      || (first === 169 && second === 254)
      || (first === 172 && second >= 16 && second <= 31)
      || (first === 192 && second === 168)
      || (first === 198 && (second === 18 || second === 19))
    )
  }
  if (isIP(normalized) === 6) {
    return !(normalized === '::' || normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb'))
  }
  return false
}

async function requirePublicDestination(url: URL) {
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported preview protocol')
  const addresses = await dns.lookup(url.hostname, { all: true })
  if (!addresses.length || addresses.some((item) => !isPublicIpAddress(item.address))) {
    throw new Error('Destination does not resolve to a public address')
  }
}

async function limitedHtml(response: Response) {
  if (!response.body) return ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let bytes = 0
  let html = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    bytes += value.byteLength
    if (bytes > MAX_PREVIEW_BYTES) throw new Error('Destination HTML exceeds preview limit')
    html += decoder.decode(value, { stream: true })
  }
  return html + decoder.decode()
}

function fallbackPreview(destinationUrl: string, campaign: Record<string, any>) {
  const material = Array.isArray(campaign.materials)
    ? campaign.materials.find((item: Record<string, any>) => item?.type === 'image' && (item.url || item.previewUrl))
    : null
  return {
    title: String(campaign.title || 'Zumbarl Campaign'),
    description: String(campaign.description || campaign.objective || 'View this campaign on Zumbarl.'),
    imageUrl: String(campaign.previewImage || material?.previewUrl || material?.url || ''),
    siteName: 'Zumbarl',
    type: 'website',
    url: destinationUrl,
    fetchedAt: new Date().toISOString(),
    source: 'campaign_fallback'
  }
}

async function fetchCampaignLinkPreview(destinationUrl: string, campaign: Record<string, any>) {
  const fallback = fallbackPreview(destinationUrl, campaign)
  if (env.NODE_ENV === 'test') return fallback
  try {
    let currentUrl = new URL(destinationUrl)
    for (let redirect = 0; redirect <= 3; redirect += 1) {
      await requirePublicDestination(currentUrl)
      const response = await globalThis.fetch(currentUrl, {
        redirect: 'manual',
        signal: globalThis.AbortSignal.timeout(5000),
        headers: { 'user-agent': 'Zumbarl-LinkPreview/1.0', accept: 'text/html' }
      })
      if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
        currentUrl = new URL(response.headers.get('location') as string, currentUrl)
        continue
      }
      if (!response.ok || !String(response.headers.get('content-type') || '').toLowerCase().includes('text/html')) return fallback
      const extracted = extractLinkPreview(await limitedHtml(response), currentUrl.toString())
      return {
        ...fallback,
        ...Object.fromEntries(Object.entries(extracted).filter(([, value]) => Boolean(value))),
        fetchedAt: new Date().toISOString(),
        source: 'destination_og'
      }
    }
  } catch {
    // Campaign publishing should remain available when a destination blocks preview bots.
  }
  return fallback
}

export {
  fetchCampaignLinkPreview,
  isPublicIpAddress
}
