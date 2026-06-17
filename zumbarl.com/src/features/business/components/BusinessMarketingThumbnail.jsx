export function BusinessMarketingThumbnail({ campaign, className = '' }) {
  const classes = ['business-marketing-thumb', `tone-${campaign.tone}`, className].filter(Boolean).join(' ')

  return (
    <span className={classes} aria-hidden="true">
      <strong>{campaign.thumbnailTitle}</strong>
      <em>{campaign.thumbnailMeta}</em>
    </span>
  )
}
