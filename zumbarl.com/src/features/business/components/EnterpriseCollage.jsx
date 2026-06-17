import { BUSINESS_ENTERPRISE_COLLAGE } from '../constants'

const collagePattern = [
  'hero',
  'tall',
  'wide',
  'square',
  'wide',
  'hero',
  'square',
  'tall',
  'wide',
  'square',
  'wide',
  'tall',
]

const collageTiles = BUSINESS_ENTERPRISE_COLLAGE.map((tile, tileIndex) => ({
  ...tile,
  key: `${tile.id}-${tileIndex}`,
  variant: collagePattern[tileIndex % collagePattern.length],
}))

function EnterpriseCollage() {
  return (
    <div className="business-enterprise-collage" aria-hidden="true">
      <div className="business-enterprise-collage-grid">
        {collageTiles.map((tile) => (
          <span
            key={tile.key}
            className={`business-collage-tile tone-${tile.tone} variant-${tile.variant}`}
          >
            <img src={tile.src} alt="" loading="lazy" decoding="async" fetchPriority="low" />
          </span>
        ))}
      </div>
    </div>
  )
}

export default EnterpriseCollage
