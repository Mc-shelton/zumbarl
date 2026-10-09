import { useState } from 'react'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'

function isPlaceholderMediaUrl(value) {
  if (!value) return false
  try {
    const parsed = new URL(value, window.location.origin)
    return parsed.hostname === 'example.com' || parsed.pathname.includes('/companies/test/')
  } catch {
    return true
  }
}

export function BusinessMarketingThumbnail({ campaign, className = '' }) {
  const material = campaign.materials?.find((item) => item.url)
  const candidateUrl = material?.previewUrl || material?.url || campaign.previewImage
  const normalizedUrl = normalizeZumbarlFileUrl(candidateUrl, material)
  const mediaUrl = isPlaceholderMediaUrl(normalizedUrl) ? '' : normalizedUrl
  const [failedUrl, setFailedUrl] = useState('')
  const isVideo = material?.type === 'video' || String(material?.mimeType || '').startsWith('video/')
  const showMedia = Boolean(mediaUrl && failedUrl !== mediaUrl && !isVideo)
  const classes = ['business-marketing-thumb', `tone-${campaign.tone}`, showMedia ? 'has-media' : '', className].filter(Boolean).join(' ')

  return (
    <span className={classes} aria-hidden="true">
      {showMedia ? (
        <img src={mediaUrl} alt="" onError={() => setFailedUrl(mediaUrl)} />
      ) : (
        <>
          <strong>{campaign.thumbnailTitle}</strong>
          <em>{isVideo ? 'Video creative' : campaign.thumbnailMeta}</em>
        </>
      )}
    </span>
  )
}
