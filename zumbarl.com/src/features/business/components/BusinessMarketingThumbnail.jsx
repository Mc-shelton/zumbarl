export function BusinessMarketingThumbnail({ campaign, className = '' }) {
  const material = campaign.materials?.find((item) => item.url)
  const mediaUrl = material?.previewUrl || material?.url || campaign.previewImage
  const isVideo = material?.type === 'video' || String(material?.mimeType || '').startsWith('video/')
  const classes = ['business-marketing-thumb', `tone-${campaign.tone}`, mediaUrl ? 'has-media' : '', className].filter(Boolean).join(' ')

  return (
    <span className={classes} aria-hidden="true">
      {mediaUrl ? (
        isVideo
          ? <video src={mediaUrl} muted playsInline preload="metadata" />
          : <img src={mediaUrl} alt="" />
      ) : (
        <>
          <strong>{campaign.thumbnailTitle}</strong>
          <em>{campaign.thumbnailMeta}</em>
        </>
      )}
    </span>
  )
}
